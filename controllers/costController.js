'use strict'
const Util = require('../util/util');
const axios = require('axios');
const Record = require('../models/record');
const Price = require('../models/price');
require('dotenv').config();
const APIKEY = process.env.APIKEY //api key google maps
const APPID = process.env.APPID //API key from weather
const MAPS_URL = process.env.MAPS_URL + APIKEY
const WEATHER_ZIP_CODE_URL = process.env.WEATHER_ZIP_CODE_URL + APPID
const controllerName = 'CostController';

function getCost(req, res) {
    const PARAMS = '&origins=' + req.params.latorigen + ',' + req.params.lonorigen + '&destinations=' + req.params.latdestino + ',' + req.params.londestino
    const ORIGINPARAMS = '&lat=' + req.params.latorigen + '&lon=' + req.params.lonorigen
    const DESTINATIONPARAMS = '&lat=' + req.params.latdestino + '&lon=' + req.params.londestino
    let resultData = []
    if (validateParams(req.params.latorigen, req.params.lonorigen, req.params.latdestino, req.params.londestino)) {
        axios.get(MAPS_URL + PARAMS).then(function(response) {
            resultData.push(response.data)
            if (response.data && response.data.destination_addresses && response.data.destination_addresses[0] != '' &&
                response.data.origin_addresses && response.data.origin_addresses[0] != '') {
                axios.get(WEATHER_ZIP_CODE_URL + ORIGINPARAMS).then(function(response) { //origin weather
                    resultData.push(response.data)
                    axios.get(WEATHER_ZIP_CODE_URL + DESTINATIONPARAMS).then(async(response) => { //Destination weather
                        // console.log('response.data: ', response.data)
                        resultData.push(response.data)
                        let origin = { place: resultData[0].origin_addresses[0], name: resultData[1].name, description: resultData[1].weather[0].description, temp: resultData[1].main.temp, icon: "http://openweathermap.org/img/wn/" + resultData[1].weather[0].icon + "@2x.png" }
                        let destination = { place: resultData[0].destination_addresses[0], name: resultData[2].name, description: resultData[2].weather[0].description, temp: resultData[2].main.temp, icon: "http://openweathermap.org/img/wn/" + resultData[2].weather[0].icon + "@2x.png" }
                        let distance = resultData[0].rows[0].elements[0].distance.text
                        let time = resultData[0].rows[0].elements[0].duration.text

                        let precio = await findPrice();
                        console.log('precio |', precio, resultData, origin, destination, distance, time);
                        await builtResponse(precio, resultData, origin, destination, distance, time, res);
                    }).catch(function(error) {
                        console.log('error : ', error)
                        Util.errorMessage(res, error)
                    });
                }).catch(function(error) {
                    console.log('error : ', error)
                    Util.errorMessage(res, error)
                });

            } else {
                console.log('response.data: vacio ', response.data)
                Util.errorMessage(res, { params: PARAMS, status: "Location not found" })
            }
        }).catch(function(error) {
            console.log('error : ', error)
            Util.errorMessage(res, error)
        });

    } else {
        Util.errorMessage(res, 'Latitud y longitud deben de ser numericos')
    }

}


async function builtResponse(prices, resultData, origin, destination, distance, time, res) {
    console.log('prices |', prices);
    let input = calculateCost(prices, resultData[0].rows[0].elements[0].distance.value, resultData[0].rows[0].elements[0].duration.value, resultData[1].weather[0].id, resultData[2].weather[0].id);
    let cost = isNaN(input.costo) ? 0 : input.costo.toFixed(2);
    let output = {
        origin,
        destination,
        cost,
        distance,
        time
    }
    let recordSaved = await saveRecord(input, output);
    console.log('recordSaved|', recordSaved);
    Util.dataValidation(res, output, controllerName);
}
async function findPrice() {
    return Price.findOne({}, (err, price) => {
        if (err) {
            console.log(' Price not found ')
            return err
        } else {
            if (!price) {
                console.log('There are not Prices in DB');
                return price
            } else {
                return { factorclima: price.factorclima, factortiempo: price.factortiempo, gasolina: price.gasolina, rendimientoxkm: price.rendimientoxkm, costoChoferXMin: price.costoChoferXMin }
                // console.log('price found : INPUTS ', INPUTS)
            }
        }
    })
}
async function saveRecord(input, output) {
    let record = new Record();
    record.input = input; //{factorclima: prices.factorclima, factortiempo: prices.factortiempo, gasolina: prices.gasolina, rendimientoxkm: prices.rendimientoxkm, costoChoferXMin: prices.costoChoferXMin };
    record.output = output;
    return record.save((err, recordStored) => { // save record 
        if (err) {
            console.log('Error to save record', err);
        } else {
            if (!recordStored) {
                console.log('Has been not  save record');
            } else {
                console.log('Record saved : ', recordStored);
                return recordStored;

            }
        }
    })
}

function validateParams(lat, lon, lat2, lon2) {
    console.log(lat, lon, lat2, lon2)
    if (Util.floatValidation(lat) && Util.floatValidation(lon) &&
        Util.floatValidation(lat2) && Util.floatValidation(lon2)) {
        return true
    }
    return false
}

function calculateCost(input, km, time, weatherCodeOrigin, weatherCodeDestination) {

    const gastosXkilometroGasolina = (parseFloat(input.gasolina) / parseFloat(input.rendimientoxkm)), //cuanto $ cuesta recorrer 1 km en el vehiculo,$20/15km=1.3$  gasolina $20 el litro y rinde para 15km 20/15=1.3 
        kilometrosXRecorrer = (km / 1000), //numero de kilometros a recorrer
        factorDeClima = (getWeatherFactor(input.factorclima, weatherCodeOrigin) + getWeatherFactor(input.factorclima, weatherCodeDestination)) / 2, // cual es el factor del clima
        factorTiempo = getDayTime(input.factortiempo[0]), // Dia, tarde o Noche
        tiempoARecorrerMin = (time / 60), // tiempo que se tardará en recorrer esa distancia (minutos)
        costoChoferXMin = input.costoChoferXMin //costo del chofer por minuto(en pesos)
        //valor = [(gastosXkilometroGasolina * NumeroKilometrosARecorrer) (factorDeClima)] + [FactorTiempo * tiempoARecorrerMin * costoChoferXMin]
        //console.log("Resultado :", gastosXkilometroGasolina, kilometrosXRecorrer, factorDeClima, factorTiempo, tiempoARecorrerMin, costoChoferXMin, '= ', gastosXkilometroGasolina * kilometrosXRecorrer * factorDeClima) + (factorTiempo * tiempoARecorrerMin * costoChoferXMin)
    return { gastosXkilometroGasolina, kilometrosXRecorrer, factorDeClima, factorTiempo, tiempoARecorrerMin, costoChoferXMin, gastosXkilometroGasolina, kilometrosXRecorrer, factorDeClima, factorTiempo, tiempoARecorrerMin, costoChoferXMin, costo: (gastosXkilometroGasolina * kilometrosXRecorrer * factorDeClima) + (factorTiempo * tiempoARecorrerMin * costoChoferXMin) }
    //valor = [(1.8 * 6)(1.6)] + (0.5*10) = (10.8 * 1.6) + 5 = 6.48  +5 = 11.48

}

function getWeatherFactor(weatherPrice, weather) {
    for (var i = 0; i < weatherPrice.length; i++) {
        if (weatherPrice[i].code == weather) {
            return weatherPrice[i].value
        }
    }
    return 1.5 //valor por default
}

function getDayTime(time) {
    var hora = new Date()
    if (hora.getHours() >= 7 && hora.getHours() <= 15) {
        return time.dia //'Dia'
    } else if (hora.getHours() >= 16) {
        return time.tarde //'tarde'
    } else if (hora.getHours() >= 18) {
        return time.noche //'Noche'
    }
}

//get the distance by latitude and longitude
function getDistanceByCoordinates(req, res) {
    console.log('params : ', req.params.latorigen, ' ', req.params.lonorigen, '   ****** ', req.params.latdestino, ' ', req.params.londestino)
    var PARAMS = '&origins=' + req.params.latorigen + ',' + req.params.lonorigen + '&destinations=' + req.params.latdestino + ',' + req.params.londestino
    console.log(' ruta: ', MAPS_URL + PARAMS)
    axios.get(MAPS_URL + PARAMS).then(function(response) {
        console.log(response.data)
        Util.message(res, response.data)
    }).catch(function(error) {
        console.log('error : ', error)
        Util.errorMessage(res, error)
    });
}

//get the weather by latitude and longitude
function getWeatherByCoordinates(req, res) {
    console.log('params : ', req.params.lat)
    var PARAMS = '&lat=' + req.params.lat + '&lon=' + req.params.lon
    console.log(' ruta: ', WEATHER_ZIP_CODE_URL + PARAMS)
    axios.get(WEATHER_ZIP_CODE_URL + PARAMS).then(function(response) {
        console.log(response.data)
        Util.message(res, response.data)
    }).catch(function(error) {
        Util.errorMessage(res, error)
    });
}


module.exports = {
    getCost,
    getWeatherByCoordinates,
    getDistanceByCoordinates
}