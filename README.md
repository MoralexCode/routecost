# RouteCost

Esta API  REST sirve para obtener la distancia, el clima de un punto **A** un puento **B **  y ademas calcula el costo que implica desplazarse.

This API  REST get the score and data of any route , in otherwise is the route cost computing.

Puedes obtener mas informacion en mi pagina web :
####Puedes obtener mas informacion en mi pagina web : [soyfullstackdeveloper.com](https://soyfullstackdeveloper.com/)

# Caracteristicas

- Obtiene el clima de un determinado lugar
- Calcula la distancia de un punto **A** a un punto **B**
- Genera elcosto que implica desplazarce entre ambos puntos.


# Instalación:
muestra los pasos específicos para instalar el proyecto. Por lo general se muestra un pedazo del código necesario para la instalación.

####Code Blocks (Indented style)

Indented 4 spaces, like `<pre>` (Preformatted Text).

    console.log('Hola Mundo')
    

#Cómo usar:
Una vez descargado, puedes ejecutar el siguiente endpoint en un cliente rest:
 


    Clima :
	'localhost:port/api/weather/17.0812951/-96.7707511'
	Distancia:
	'localhost:port/api/distance/16.430746/-95.4399602/17.0812951/-96.7707511'
	Clima, distancia y el costo :
	'localhost:port/api/cost/16.430746/-95.4399602/17.0812951/-96.7707511'
####Respuesta
	
	
    {
    "response": {
        "origin": {
            "place": "José María Morelos y Pavón, Aguascalientes, Santa María Jalapa del Marqués, Oax., Mexico",
            "name": "Jalapa",
            "description": "cielo claro",
            "temp": 26.93,
            "icon": "http://openweathermap.org/img/wn/01d@2x.png"
        },
        "destination": {
            "place": "Cuicatlán 105, Col Guelaguetza, Santa María Atzompa, Oax., Mexico",
            "name": "San Jacinto Amilpas",
            "description": "cielo claro",
            "temp": 22,
            "icon": "http://openweathermap.org/img/wn/01d@2x.png"
        },
        "cost": "1706.00",
        "distance": "228 km",
        "time": "4 hours 12 mins"
    }
}


    

#### if the API KEY  is invalid, you can see this message :
    

	MAPS_URL response :  {  destination_addresses: [],   error_message: 'The provided API key is invalid.',  origin_addresses: [],   rows: [],  status: 'REQUEST_DENIED'}
	
    
## Licencia
MIT