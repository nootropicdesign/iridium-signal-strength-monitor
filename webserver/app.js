(function () {
    "use strict";
    Cesium.Ion.defaultAccessToken = 'YOUR_CESIUM_ION_ACCESS_TOKEN';
    var viewer = new Cesium.Viewer('cesiumContainer', {
        scene3DOnly: false,
        selectionIndicator: false,
        baseLayerPicker: false,
        shouldAnimate: true,
        targetFrameRate: 30,
        imageryProvider : new Cesium.MapboxImageryProvider({
            mapId: 'mapbox.dark',
            accessToken: 'YOUR_MAPBOX_ACCESS_TOKEN'
        }),
    });
    var tlejs = new TLEJS();
    const NOOTROPIC_DESIGN_LAT =  45.0468;
    const NOOTROPIC_DESIGN_LNG = -93.4747;
    const NOOTROPIC_DESIGN_ELEV = 315;
    const R = 6371000;

    var satellites;
    var satEntities = [];
    var stepMS = 60000; // plot point every 60 seconds
    var now = Date.now();
    var nowDate = Cesium.JulianDate.now();
    var signalBarImages = [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAA9CAYAAAA6e+4pAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4wwZFSEviUZ/uQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAuElEQVR42u3XsQ2AIBQEUDCu4SaO7yYOop2NDeZrAHnXS8zLRbmc5Mq+pePpMxO2WGYE9yxryqVt1cBgAAIECBCgAAQI0BIZbseWLA4N1MDvdqxvoJ8IQIAIAAIECFAAjrxEau1YDdTAujtWAwECBIgAIECAAAVgz0uk5y2rgX/awj1uWQ0ECBCgAAQIEKAArLFERt6xGtjSFh5xx2ogQIAAEQAECBCghC/Sb1ySo2e08A5Pz9DAYE6x/Cty4gNFmwAAAABJRU5ErkJggg==",
        
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAA9CAYAAAA6e+4pAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4wwZFSIUE2DFXgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAtElEQVR42u3ZsQ2AIBQEUDCu4SaO7yYOop2NDeajBHnXQ/Fy0VzISa7sWzqenpmwxTIjuGdZUy5tqwYGAxAgQIAABSBAgJbIcDu2ZHFooAa+t2N9A/1EAAJEABAgQIACcOQl0mrHaqAGtt2xGggQIEAEAAECBCgAe14iPW9ZDfzTFu5xy2ogQIAABSBAgAAFYIslMvKO1UCAAAEiAAgQIEABCLDTKVfzsuiDUY0Hp6/v0MBgTihIJcrBuX9EAAAAAElFTkSuQmCC",

        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAA9CAYAAAA6e+4pAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4wwZFSIlQr7FZAAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAArklEQVR42u3asQmAMBQE0ERcw00c300cRDsbm0iiMfx3fUQeh3KQnOTKvqXj6ZkJW11mBPcsa8qlbdXAygAECBAgQAEIEKAlEm7HliwODdTA93asb6CfCECACAACBAhQAEZeIr12rAZqYN8dq4EAAQJEABAgQIACcOQlMvKW1UCAAAEKQIAAAQpAgADjbeHIO1YDAQIEiAAgQIAABSDAQafcn16mxeXJr5+hgZU5AdnxICJC8fAYAAAAAElFTkSuQmCC",

        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAA9CAYAAAA6e+4pAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4wwZFSIwL2MhjwAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAqUlEQVR42u3bsQmAMBQE0B9xDTdxfDdxEO1sbBISEf3v+gg+DuWKlJAr+xZH65kJW19mBPcsa5TatmpgZwACBAgQoAAECNASSbdjaxaHBmrgczvWN9BPBCBABAABAgQoADMvkbd2rAYCBAgQAUCAAAEKQIAAbeGMW1YDAQIEKAABAgQoAAECzLeFM+9YDQQIECACgAABAhSAAD865f72QiMuErY8QwM7cwKwfRp6c9gP3gAAAABJRU5ErkJggg==",

        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAA9CAYAAAA6e+4pAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4wwZFSI7uLH4BwAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAnElEQVR42u3XsQ2AMAxFQQexBpswPptkEOho0iRyBb7Xpzk5xW+ht37Fvfpmw5ZrRzB2nNFmr9UFJgMIECBAgAIIEKAlUm7HziwOF+gLAwQogAABAhRAgABt4T/tWBcIECBABAABAgQogAAB2sIVt6wLBAgQoAACBAhQAAECrLeFK+9YFwgQIEAEAAECBCiAAD865RCMrcxbF5jsAcJ1FNJuoaieAAAAAElFTkSuQmCC",

        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAA9CAYAAAA6e+4pAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4wwZFSMK8HTJfAAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAjElEQVR42u3XsQ3AIBAEwceiDXdC+e6EQnDmHFkiudmcZPQE10pf86m1++bC9i+AAAECBCiAAAECFMDz9eQde49qLtAXBghQAAECBCiAAAHawkk71gUCBAgQAUCAAAEKIECAtnDilnWBAAECFECAAAEKIECAeVs4ece6QIAAASIACBAgQAEECBCg9nsBCuQPKOyx9dcAAAAASUVORK5CYII="
    ];

    function createSatelliteEntity(satelliteInfo) {
        var sampledPosition = new Cesium.SampledPositionProperty();
        const orbitTime = tlejs.getOrbitTimeMS(satelliteInfo.tle);
        const n = 20;
        var start = now;
        var stop  = now + (n*orbitTime);
        var satInfo = tlejs.getSatelliteInfo(satelliteInfo.tle, start);
        var h = satInfo.height*1000; // not the correct height for every position on Earth, but close enough for drawing footprint.

        var count=0;
        for (var t=start; t<=stop; t+=stepMS) {
            var satInfo = tlejs.getSatelliteInfo(satelliteInfo.tle, t);
            var time = Cesium.JulianDate.fromDate(new Date(t));
            var position = Cesium.Cartesian3.fromDegrees(satInfo.lng, satInfo.lat, h);
            sampledPosition.addSample(time, position);
            count++;
        }

        var satellite = viewer.entities.add({
            //Set the entity availability to the same interval as the simulation time.
            availability : new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                start : Cesium.JulianDate.fromDate(new Date(start)),
                stop : Cesium.JulianDate.fromDate(new Date(stop))
            })]),
        
            //Use our computed positions
            position : sampledPosition,
            point : {
                pixelSize : 10,
                color : Cesium.Color.fromCssColorString('#edc100')
            },
            id: satelliteInfo.name,
            label : {
                text : satelliteInfo.name,
                font : '10pt monospace',
                style: Cesium.LabelStyle.FILL,
                fillColor: Cesium.Color.CYAN,
                backgroundColor: Cesium.Color.GRAY,
                backgroundPadding: new Cesium.Cartesian2(10, 10),
                horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                pixelOffset: new Cesium.Cartesian2(10, 0),
                eyeOffset: new Cesium.Cartesian3(0.0, 0.0, -100000.0)
            },
            ellipse : {
                show: false,
                fill: false,
                outline: true,
                outlineColor: Cesium.Color.LIME.withAlpha(0.75),
                outlineWidth: 1,
                semiMinorAxis : 0,
                semiMajorAxis : 0
            },
            path : {
                show: true,
                resolution : 60,
                leadTime: (orbitTime/2) / 1000,
                trailTime: (orbitTime/2) / 1000,
                material : Cesium.Color.fromCssColorString('#FF5500').withAlpha(0.75),
                width : 1
            }
        });
        return satellite;
    }

    function setupClosestSatellite() {
        var t = Cesium.JulianDate.now();
        var closestSatelliteInfo = getClosestSatelliteInfo(t);
        var sat = closestSatelliteInfo.satellite;
        var p = closestSatelliteInfo.position;

        var sampledPosition = new Cesium.SampledPositionProperty();
        sampledPosition.addSample(t, p);

        // create an entity to keep track of the closest satellite position as it changes over time
        // and as it swtiches between satellites
        var closestSatellite = viewer.entities.add({
            id: 'closestSatellite',
            position : sampledPosition
        });

        // create a line entity to render a line between the ground station and the position of the closest satellite
        var closestSatelliteLine = viewer.entities.add({
            polyline: {
                positions: new Cesium.PositionPropertyArray([
                    new Cesium.ReferenceProperty(
                        viewer.entities,
                        'groundStation',
                        [ 'position' ]
                    ),
                    new Cesium.ReferenceProperty(
                        viewer.entities,
                        'closestSatellite',
                        [ 'position' ]
                    )
                ]),
                material: Cesium.Color.LIME.withAlpha(0.75),
                arcType: Cesium.ArcType.NONE
            }
        })
        return sat;
    }

    var nowDate = Cesium.JulianDate.now();
    var clockStart = nowDate;
    var clockStop =  Cesium.JulianDate.addHours(nowDate, 24, new Cesium.JulianDate());
    viewer.clock.currentTime = nowDate;
    viewer.clock.startTime = clockStart;
    viewer.clock.stopTime = clockStop;
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    viewer.clock.multiplier = 1;
    viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
    //Set timeline to simulation bounds
    viewer.timeline.zoomTo(clockStart, clockStop);
    viewer.scene.globe.enableLighting = false;
    viewer.scene.preRender.addEventListener(updateClock);

    var groundStationPosition = Cesium.Cartesian3.fromDegrees(NOOTROPIC_DESIGN_LNG, NOOTROPIC_DESIGN_LAT, NOOTROPIC_DESIGN_ELEV);
    var groundStationPositionProperty = new Cesium.ConstantPositionProperty(groundStationPosition);
    var groundStation = viewer.entities.add({
        id: 'groundStation',
        position : groundStationPositionProperty,
        point : {
            pixelSize : 10,
            color : Cesium.Color.fromCssColorString('#FF5500')
        },
        label : {
            text : "nootropic design",
            font : '10pt monospace',
            style: Cesium.LabelStyle.FILL,
            fillColor: Cesium.Color.fromCssColorString('#e3c400'),
            pixelOffset: new Cesium.Cartesian2(0, 12),
        }
    });

    var currentClosestSatellite; // entity of closest satellite    

    var signalQualityProperty = new Cesium.TimeIntervalCollectionProperty();
    var signalQuality = viewer.entities.add({
        position : Cesium.Cartesian3.fromDegrees(NOOTROPIC_DESIGN_LNG, NOOTROPIC_DESIGN_LAT),
        billboard : {
            image: signalQualityProperty,
            pixelOffset: new Cesium.Cartesian2(0, -40),
        }
    });


    $.get("sats?id=iridium", function(data) {
        satellites = data;
        console.log("adding " + satellites.length + " to model");
        for(var i=0;i<satellites.length;i++) {
            satEntities.push(createSatelliteEntity(satellites[i]));
        }

        var val = $('#footprintRange').val();
        setFootprintSize(val/100.0);
        viewer.scene.preRender.addEventListener(updateElevationAngle);

        currentClosestSatellite = setupClosestSatellite();
    });

    function updateClock() {
        var m = moment(Cesium.JulianDate.toDate(viewer.clock.currentTime));
        $('#clock').text(m.format("HH:mm:ss"));
    }

    function updateElevationAngle() {
        $('#elevationAngle').text(computeElevationAngle());
    }

    function computeElevationAngle() {
        // use satellites[0];
        var entity = viewer.entities.getById(satellites[0].name);
        var footprintRadius = entity.ellipse.semiMajorAxis;
        var position = entity.position.getValue(Cesium.JulianDate.now());
        var cart = Cesium.Cartographic.fromCartesian(position);

        var lat1 = cart.latitude;
        var lng1 = cart.longitude;
        var bearing = 0;
        var angularDistance = (footprintRadius)/R;
        var lat2 = Math.asin( Math.sin(lat1)*Math.cos(angularDistance) + Math.cos(lat1)*Math.sin(angularDistance)*Math.cos(bearing));
        var lng2 = lng1 + Math.atan2(Math.sin(bearing)*Math.sin(angularDistance)*Math.cos(lat1), Math.cos(angularDistance)-Math.sin(lat1)*Math.sin(lat2));

        lat2 = (lat2 * 180)/Math.PI; // convert to degrees
        lng2 = (lng2 * 180)/Math.PI;

        var s = tlejs.getSatelliteInfo(satellites[0].tle, Date.now(), lat2, lng2, 0);
        return Math.round(s.elevation);
    }

    function setFootprintVisibility(show) {
        satEntities.forEach(sat => {
            sat.ellipse.show = show;
        });
    }

    function setFootprintSize(scale) {
        satellites.forEach(sat => {
            var entity = viewer.entities.getById(sat.name);
            var position = entity.position.getValue(Cesium.JulianDate.now());
            var h = Cesium.Cartographic.fromCartesian(position).height;
            var footprintRadius = R*Math.acos(R / (R+h));
            footprintRadius = footprintRadius * scale;
            entity.ellipse.semiMinorAxis = footprintRadius;
            entity.ellipse.semiMajorAxis = footprintRadius;
        });
    }

    $("#showFootprints").on("click", function(){
        if ($('#showFootprints').is(':checked')) {
            setFootprintVisibility(true);
        } else {
            setFootprintVisibility(false);
        }
    });

    $("#footprintRange").on("input", function(){
        var val = $('#footprintRange').val();
        setFootprintSize(val/100.0);
    });

    var ctx = $('#dataPlot');
    var dataChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'signal strength vs. distance',
                backgroundColor: '#ff0000',
                data: []
            }]
        },
        options: {
            legend: {
                display: true,
                align: 'start',
                labels: {
                    boxWidth: 12
                }
            },
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                    scaleLabel: {
                        display: true,
                        labelString: 'distance (km)'
                    },
                    ticks: {
                        min: 500,
                        max: 2000,
                        stepSize: 100
                    }

                }],
                yAxes: [{
                    type: 'linear',
                    position: 'left',
                    ticks: {
                        suggestedMin: 0,
                        suggestedMax: 5,
                        stepSize: 1
                    }
                }]
            }
        }
    });

    function getClosestSatelliteInfo(time) {
        var closestDistance = 1000000;
        var closestSatellite;
        var closestPosition;
        var distance;
        for(var i=0;i<satEntities.length;i++) {
            var satPostion = satEntities[i].position.getValue(time);
            distance = (Cesium.Cartesian3.distance(groundStationPosition, satPostion))/ 1000.0; // convert to km
            distance = Math.round(distance);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestSatellite = satEntities[i];
                closestPosition = satPostion;
            }
        }
        return {
            satellite: closestSatellite,
            distance: closestDistance,
            position: closestPosition
        };
    }

    // Start a socket connection to the server
    var socket = io.connect();
    socket.on('iridium-data',
        function(s) {
            var data = JSON.parse(s);
            if (!data.timestamp) {
                console.log("no timestamp in data");
                return;
            }
            var signalQualityStart = Cesium.JulianDate.fromIso8601(data.timestamp);
            var signalQualityStop = new Cesium.JulianDate();
            Cesium.JulianDate.addSeconds(signalQualityStart, 20, signalQualityStop);
            signalQualityProperty.intervals.addInterval(new Cesium.TimeInterval({
                start: signalQualityStart,
                stop: signalQualityStop,
                data: signalBarImages[data.signalQuality]
            }));

            
            var closestSatelliteInfo = getClosestSatelliteInfo(signalQualityStart);
            var closestSatellite = closestSatelliteInfo.satellite;
            var closestSatellitePosition = closestSatelliteInfo.position;
            var closestSatelliteDistance = closestSatelliteInfo.distance;
            console.log(closestSatellite.id + ": range=" + closestSatelliteDistance + " km  signal=", data.signalQuality);

            var future = new Cesium.JulianDate();
            Cesium.JulianDate.addSeconds(signalQualityStart, 20, future);

            var closestSatelliteEntity = viewer.entities.getById('closestSatellite');
            if (closestSatellite != currentClosestSatellite) {
                // a different satellite is now the closest
                // remove extrapolated position(s)
                var timeInterval = new Cesium.TimeInterval({
                    start: signalQualityStart,
                    stop: future
                });
                closestSatelliteEntity.position.removeSamples(timeInterval);

                // compute a time just before the new signal quality was received for this new closest satellite
                // so we can add a last sample for the last closest satellite so that the switchover is sudden
                var d = new Date(Cesium.JulianDate.toDate(signalQualityStart).getTime() - 1); // 1ms before
                var lastSampleTime = Cesium.JulianDate.fromDate(d);
                var lastSamplePosition = currentClosestSatellite.position.getValue(lastSampleTime);
                closestSatelliteEntity.position.addSample(lastSampleTime, lastSamplePosition);
                currentClosestSatellite = closestSatellite;
            }
            closestSatelliteEntity.position.addSample(signalQualityStart, closestSatellitePosition);

            // extrapolate 20 seconds into the future so the line is drawn for live view
            closestSatellitePosition = closestSatellite.position.getValue(future);
            closestSatelliteEntity.position.addSample(future, closestSatellitePosition);

            var chartData = {
                x: closestSatelliteDistance,
                y: data.signalQuality
            }
            dataChart.data.datasets.forEach((dataset) => {
                dataset.data.push(chartData);
            });
            dataChart.update();

        }
    );
    
}());

$(document).ready(function () {
    var credit = document.getElementsByClassName('cesium-credit-textContainer')[0];
    credit.style.display = 'none';
});
