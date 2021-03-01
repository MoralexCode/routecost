'use strict'
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var PriceSchema = Schema({
    gasolina: String,
    rendimientoxkm: String, //cuentos KM rinde un L de gas en el vehiculo
    factortiempo: [Schema.Types.Mixed], //Dia , Tarde, Noche
    factorclima: [Schema.Types.Mixed], //Dia , Tarde, Noche
    costoChoferXMin: String, //Costo del chofer por minuto
});
module.exports = mongoose.model('Price', PriceSchema)