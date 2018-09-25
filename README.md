# kepler-tiles
Show raster tiles in kepler.gl
### this is test repo

#to start local dev
```bash
$ yarn
$ yarn run start
```
> it show as 2 cog-images as tiles

> tiles generated via URL with [COG Map and tiles.rdnt.io](https://medium.com/radiant-earth-insights/cog-map-and-tiles-rdnt-io-ad0745388a14)

> for docker-image of tiles-service visit [Git](https://github.com/radiantearth/tiles.rdnt.io) 

#adding COG-tiles to map
to pass tile-server URL for COG add Data as GeoJson
with  field `COGURL` in path `features.type.properties`

`COGURL` is array of URLS to tiles-serves. each server is queried for tile of COG so having many serc\vers will  increase visualisation performance

Example GeoJson
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "COGURL": ["http://localhost:8090/tiles/{z}/{x}/{y}@2x?url=http://s3.eu-de.objectstorage.softlayer.net/cog-1/cog-example.tif"]
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [168.452,-17.557],[168.452,-17.550],[168.459,-17.549],[168.459,-17.557],[168.452,-17.557]
          ]
        ]
      }
    }
  ]
}
```



