import { createRequire } from 'module'
const require = createRequire(import.meta.url);
const inquirer = require('inquirer')
const axios = require('axios')
const { format } = require('date-fns')
const startOfTomorrow = require('date-fns/startOfTomorrow')
import beeper from 'beeper'
const chalk = require('chalk');

function Input() {
    return inquirer.prompt([
        {
            type: "input",
            name: "State",
            message: "Enter Your State:"
        },
        {
            type: "input",
            name: "District",
            message: "Enter Your District:"
        },
        {
            type: "input",
            name: "Age",
            message: "Enter Your Age:",
        },
    ])
}

const noise = async () => {
    console.log('beeep')
    await beeper();
}

const CheckSlot = (DistrictId, date, age) => {
    let isSlotAvalaible = false
    axios.get(`https://www.cowin.gov.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${DistrictId}&date=${date}`)
        .then((res) => {
            const { centers } = res.data;
            if (centers.length) {
                centers.forEach(center => {
                    center.sessions.forEach((session => {
                        if (session.min_age_limit < +age && session.available_capacity > 0) {
                            isSlotAvalaible = true
                        }
                    }))
                });
            }
            if (isSlotAvalaible) {
                console.log(chalk.green('Slot is Available'));
                noise()
            }
            else {
                console.log(chalk.red('Slot is not Available'));
            }
        })
        .catch((err) => {
            console.log(err)
        })
}

Input().then(function (response) {
    const { State, District, Age } = response;
    axios.get('https://www.cowin.gov.in/api/v2/admin/location/states').then((res) => {
        const data = res.data.states.filter((state) => state.state_name === State);
        const StateId = data[0].state_id
        axios.get(`https://www.cowin.gov.in/api/v2/admin/location/districts/${StateId}`).then((res) => {
            const DistrictId = res.data.districts.filter((district) => district.district_name === District)[0].district_id
            const date = format(startOfTomorrow(), 'dd-MM-yyyy')
            CheckSlot(DistrictId, date, Age)
            setInterval(() => {
                CheckSlot(DistrictId, date, Age)
            }, 60000)
        }).catch((error) => {
            console.log(error);
        })
    }).catch((error) => {
        console.log(error);
    })
}).then(function () {
    console.log("getting data ...");
}).catch(function (err) {
    console.log(err);
})