// A simple demo of 3D Tiles feature picking with hover and select behavior
// Building data courtesy of NYC OpenData portal: http://www1.nyc.gov/site/doitt/initiatives/3d-building.page
var viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: Cesium.createWorldTerrain()
});

viewer.scene.globe.depthTestAgainstTerrain = true;

// Set the initial camera view to look at Manhattan
var initialPosition = Cesium.Cartesian3.fromDegrees(-74.01881302800248, 40.69114333714821, 753);
var initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(21.27879878293835, -21.34390550872461, 0.0716951918898415);
viewer.scene.camera.setView({
    destination: initialPosition,
    orientation: initialOrientation,
    endTransform: Cesium.Matrix4.IDENTITY
});

// Load the NYC buildings tileset
var tileset = new Cesium.Cesium3DTileset({url: Cesium.IonResource.fromAssetId(3839)});
tileset.style = new Cesium.Cesium3DTileStyle({
    color: {
        conditions: [
            ['${height} >= 300', 'rgba(45, 0, 75, 0.5)'],
            ['${height} >= 200', 'rgb(102, 71, 151)'],
            ['${height} >= 100', 'rgb(170, 162, 204)'],
            ['${height} >= 50', 'rgb(224, 226, 238)'],
            ['${height} >= 25', 'rgb(252, 230, 200)'],
            ['${height} >= 10', 'rgb(248, 176, 87)'],
            ['${height} >= 5', 'rgb(198, 106, 11)'],
            ['true', 'rgb(127, 59, 8)']
        ]
    }
});
viewer.scene.primitives.add(tileset);
viewer.zoomTo(viewer.scene.primitives);

// HTML overlay for showing feature name on mouseover
var nameOverlay = document.createElement('div');
viewer.container.appendChild(nameOverlay);
nameOverlay.className = 'backdrop';
nameOverlay.style.display = 'none';
nameOverlay.style.position = 'absolute';
nameOverlay.style.bottom = '0';
nameOverlay.style.left = '0';
nameOverlay.style['pointer-events'] = 'none';
nameOverlay.style.padding = '4px';
nameOverlay.style.backgroundColor = 'black';

// Information about the currently selected feature
var selected = {
    feature: undefined,
    originalColor: new Cesium.Color()
};

// An entity object which will hold info about the currently selected feature for infobox display
var selectedEntity = new Cesium.Entity();


var boundingBox = undefined;


// Get default left click handler for when a feature is not picked on left click
var clickHandler = viewer.screenSpaceEventHandler.getInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);

// If silhouettes are supported, silhouette features in blue on mouse over and silhouette green on mouse click.
// If silhouettes are not supported, change the feature color to yellow on mouse over and green on mouse click.
if (Cesium.PostProcessStageLibrary.isSilhouetteSupported(viewer.scene)) {
    // Silhouettes are supported
    var silhouetteBlue = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
    silhouetteBlue.uniforms.color = Cesium.Color.BLUE;
    silhouetteBlue.uniforms.length = 0.01;
    silhouetteBlue.selected = [];

    var silhouetteGreen = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
    silhouetteGreen.uniforms.color = Cesium.Color.LIME;
    silhouetteGreen.uniforms.length = 0.01;
    silhouetteGreen.selected = [];

    viewer.scene.postProcessStages.add(Cesium.PostProcessStageLibrary.createSilhouetteStage([silhouetteBlue, silhouetteGreen]));

    // Silhouette a feature blue on hover.
    viewer.screenSpaceEventHandler.setInputAction(function onMouseMove(movement) {
        // If a feature was previously highlighted, undo the highlight
        silhouetteBlue.selected = [];

        // Pick a new feature
        var pickedFeature = viewer.scene.pick(movement.endPosition);
        if (!Cesium.defined(pickedFeature)) {
            nameOverlay.style.display = 'none';
            return;
        }

        // A feature was picked, so show it's overlay content
        nameOverlay.style.display = 'block';
        nameOverlay.style.bottom = viewer.canvas.clientHeight - movement.endPosition.y + 'px';
        nameOverlay.style.left = movement.endPosition.x + 'px';
        var name = pickedFeature.getProperty('name');
        if (!Cesium.defined(name)) {
            name = pickedFeature.getProperty('id');
        }
        nameOverlay.textContent = name;

        // Highlight the feature if it's not already selected.
        if (pickedFeature !== selected.feature) {
            silhouetteBlue.selected = [pickedFeature];
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Silhouette a feature on selection and show metadata in the InfoBox.
    viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(movement) {
        // If a feature was previously selected, undo the highlight
        silhouetteGreen.selected = [];

        // Pick a new feature
        var pickedFeature = viewer.scene.pick(movement.position);
        if (!Cesium.defined(pickedFeature)) {
            clickHandler(movement);
            return;
        }

        // Select the feature if it's not already selected
        if (silhouetteGreen.selected[0] === pickedFeature) {
            return;
        }


        let n = Object.keys(document.data.lat).length;
        let result;

        // Init the typed array with the same length as the number of items in the array parameter
        const lngArray = new Float64Array(n);
        const latArray = new Float64Array(n);
        const hgtArray = new Float64Array(n);
        const yawArray = new Float64Array(n);
        const pitchArray = new Float64Array(n);
        const rollArray = new Float64Array(n);

        // Populate the array with the values
        for (let i = 0; i < n; i++) {
            lngArray[i] = document.data.lng[i];
            latArray[i] = document.data.lat[i];
            hgtArray[i] = document.data.hgt[i];
            yawArray[i] = document.data.yaw[i];
            pitchArray[i] = document.data.pitch[i];
            rollArray[i] = document.data.roll[i];
        }

        // Allocate some space in the heap for the data (making sure to use the appropriate memory size of the elements)
        let lngBuffer = Module._malloc(lngArray.length * lngArray.BYTES_PER_ELEMENT);
        let latBuffer = Module._malloc(latArray.length * latArray.BYTES_PER_ELEMENT);
        let hgtBuffer = Module._malloc(hgtArray.length * hgtArray.BYTES_PER_ELEMENT);
        let yawBuffer = Module._malloc(yawArray.length * yawArray.BYTES_PER_ELEMENT);
        let pitchBuffer = Module._malloc(pitchArray.length * pitchArray.BYTES_PER_ELEMENT);
        let rollBuffer = Module._malloc(rollArray.length * rollArray.BYTES_PER_ELEMENT);

        // Assign the data to the heap - Keep in mind bytes per element
        Module.HEAPF64.set(lngArray, lngBuffer >> 3);
        Module.HEAPF64.set(latArray, latBuffer >> 3);
        Module.HEAPF64.set(hgtArray, hgtBuffer >> 3);
        Module.HEAPF64.set(yawArray, yawBuffer >> 3);
        Module.HEAPF64.set(pitchArray, pitchBuffer >> 3);
        Module.HEAPF64.set(rollArray, rollBuffer >> 3);


        var lng = pickedFeature.getProperty("longitude") * 180 / 3.141592653589793238;
        var lat = pickedFeature.getProperty("latitude") * 180 / 3.141592653589793238;
        var hgt = pickedFeature.getProperty("height");


        // Finally, call the function with "number" parameter type for the array (the pointer), and an extra length parameter
        result = Module.ccall("VCM", "number", ["number", "number", "number", "number", "number",
            "number", "number", "number", "number", "number",
            "number", "number", "number", "number", "number", "number"], [latBuffer, lngBuffer, hgtBuffer, yawBuffer,
            pitchBuffer, rollBuffer, n, document.R, document.alpha, document.camera,
            lat, lng, hgt / 2 + 10, 100.0, 100.0, hgt
        ]);
        resultECM = Module.ccall("ECM", "number", ["number", "number", "number", "number", "number",
            "number", "number", "number", "number", "number",
            "number", "number", "number", "number", "number", "number", "number"], [latBuffer, lngBuffer, hgtBuffer, yawBuffer,
            pitchBuffer, rollBuffer, n, document.R, document.alpha, document.camera,
            lat, lng, hgt / 2 + 10, 100.0, 100.0, hgt, document.angles
        ]);
        resultWCM = Module.ccall("ECM", "number", ["number", "number", "number", "number", "number",
            "number", "number", "number", "number", "number",
            "number", "number", "number", "number", "number", "number", "number", "numbers"], [latBuffer, lngBuffer, hgtBuffer, yawBuffer,
            pitchBuffer, rollBuffer, n, document.R, document.alpha, document.camera,
            lat, lng, hgt / 2 + 10, 100.0, 100.0, hgt, document.angles, document.cells
        ]);

        // alert([lat, lng, hgt]);
        // alert(result);


        // alert(boundingBox.center);
        // alert(boundingBox.halfAxes);

        // alert(Cesium.PolygonGeometry.fromOrientedBoundingBox(boundingBox));
        if (boundingBox !== undefined) {
            viewer.entities.remove(boundingBox);
        }

        boundingBox = viewer.entities.add({
            name: 'Yellow box outline',
            position: Cesium.Cartesian3.fromDegrees(lng, lat, hgt / 2 + 10),
            box: {
                dimensions: new Cesium.Cartesian3(100.0, 100.0, hgt),
                fill: false,
                outline: true,
                outlineColor: Cesium.Color.YELLOW
            }
        });


        // Save the selected feature's original color
        var highlightedFeature = silhouetteBlue.selected[0];
        if (pickedFeature === highlightedFeature) {
            silhouetteBlue.selected = [];
        }

        // Highlight newly selected feature
        silhouetteGreen.selected = [pickedFeature];

        // Set feature infobox description
        var featureName = pickedFeature.getProperty('name');
        selectedEntity.name = featureName;
        selectedEntity.description = 'Loading <div class="cesium-infoBox-loading"></div>';
        viewer.selectedEntity = selectedEntity;
        selectedEntity.description = '<table class="cesium-infoBox-defaultTable"><tbody>' +
            '<tr><th>Longitude</th><td>' + pickedFeature.getProperty('longitude') * 180 / 3.141592653589793238 + '</td></tr>' +
            '<tr><th>Latitude</th><td>' + pickedFeature.getProperty('latitude') * 180 / 3.141592653589793238 + '</td></tr>' +
            '<tr><th>Height</th><td>' + pickedFeature.getProperty('height') + '</td></tr>' +
            '<tr><th>VCM</th><td>' + (100 * result).toFixed(2) + '% </td></tr>' +
            '<tr><th>ECM</th><td>' + (100 * resultECM).toFixed(2) + '% </td></tr>' +
            '<tr><th>WCM</th><td>' + (100 * resultWCM).toFixed(2) + '% </td></tr>' +
            '</tbody></table>';
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
} else {
    // Silhouettes are not supported. Instead, change the feature color.

    // Information about the currently highlighted feature
    var highlighted = {
        feature: undefined,
        originalColor: new Cesium.Color()
    };

    // Color a feature yellow on hover.
    viewer.screenSpaceEventHandler.setInputAction(function onMouseMove(movement) {
        // If a feature was previously highlighted, undo the highlight
        if (Cesium.defined(highlighted.feature)) {
            highlighted.feature.color = highlighted.originalColor;
            highlighted.feature = undefined;
        }
        // Pick a new feature
        var pickedFeature = viewer.scene.pick(movement.endPosition);
        if (!Cesium.defined(pickedFeature)) {
            nameOverlay.style.display = 'none';
            return;
        }
        // A feature was picked, so show it's overlay content
        nameOverlay.style.display = 'block';
        nameOverlay.style.bottom = viewer.canvas.clientHeight - movement.endPosition.y + 'px';
        nameOverlay.style.left = movement.endPosition.x + 'px';
        var name = pickedFeature.getProperty('name');
        if (!Cesium.defined(name)) {
            name = pickedFeature.getProperty('id');
        }
        nameOverlay.textContent = name;
        // Highlight the feature if it's not already selected.
        if (pickedFeature !== selected.feature) {
            highlighted.feature = pickedFeature;
            Cesium.Color.clone(pickedFeature.color, highlighted.originalColor);
            pickedFeature.color = Cesium.Color.YELLOW;
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Color a feature on selection and show metadata in the InfoBox.
    viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(movement) {
        // If a feature was previously selected, undo the highlight
        if (Cesium.defined(selected.feature)) {
            selected.feature.color = selected.originalColor;
            selected.feature = undefined;
        }
        // Pick a new feature
        var pickedFeature = viewer.scene.pick(movement.position);
        if (!Cesium.defined(pickedFeature)) {
            clickHandler(movement);
            return;
        }
        // Select the feature if it's not already selected
        if (selected.feature === pickedFeature) {
            return;
        }
        selected.feature = pickedFeature;


        // Save the selected feature's original color
        if (pickedFeature === highlighted.feature) {
            Cesium.Color.clone(highlighted.originalColor, selected.originalColor);
            highlighted.feature = undefined;
        } else {
            Cesium.Color.clone(pickedFeature.color, selected.originalColor);
        }
        // Highlight newly selected feature
        pickedFeature.color = Cesium.Color.LIME;
        // Set feature infobox description
        var featureName = pickedFeature.getProperty('name');
        selectedEntity.name = featureName;
        selectedEntity.description = 'Loading <div class="cesium-infoBox-loading"></div>';
        viewer.selectedEntity = selectedEntity;
        selectedEntity.description = '<table class="cesium-infoBox-defaultTable"><tbody>' +
            '<tr><th>BIN</th><td>' + pickedFeature.getProperty('BIN') + '</td></tr>' +
            '<tr><th>DOITT ID</th><td>' + pickedFeature.getProperty('DOITT_ID') + '</td></tr>' +
            '<tr><th>SOURCE ID</th><td>' + pickedFeature.getProperty('SOURCE_ID') + '</td></tr>' +
            '<tr><th>Longitude</th><td>' + pickedFeature.getProperty('longitude') + '</td></tr>' +
            '<tr><th>Latitude</th><td>' + pickedFeature.getProperty('latitude') + '</td></tr>' +
            '<tr><th>Height</th><td>' + pickedFeature.getProperty('height') + '</td></tr>' +
            '<tr><th>Terrain Height (Ellipsoid)</th><td>' + pickedFeature.getProperty('TerrainHeight') + '</td></tr>' +
            '</tbody></table>';
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}


Sandcastle.addToolbarMenu([{
    text: 'Dataset1',
    onselect: function () {
        document.data = JSON.parse(JSON.stringify(data1));
        var n = Object.keys(document.data.lat).length;


        drawData();
    }
}, {
    text: 'Dataset1 (high)',
    onselect: function () {
        document.data = JSON.parse(JSON.stringify(data1));
        var n = Object.keys(document.data.lat).length;

        for (let i = 0; i < n; i++)
            document.data.hgt[i] += 300;
        drawData();
    }
}, {
    text: 'Dataset1 (low)',
    onselect: function () {
        document.data = JSON.parse(JSON.stringify(data1));
        var n = Object.keys(document.data.lat).length;
        for (let i = 0; i < n; i++)
            document.data.hgt[i] -= 150;
        drawData();
    }
}, {
    text: 'Dataset1 (change pitch)',
    onselect: function () {
        document.data = JSON.parse(JSON.stringify(data1));
        var n = Object.keys(document.data.lat).length;
        let n4 = parseInt(n / 4);
        for (let i = 0; i < n4; i++)
            document.data.pitch[i] = -Math.PI / 2 + Math.PI * i / n4;
        for (let i = n4; i < n4 * 2; i++)
            document.data.pitch[i] = Math.PI / 2 - Math.PI * (i - n4) / n4;
        for (let i = n4 * 2; i < n4 * 3; i++)
            document.data.pitch[i] = -Math.PI / 2 + Math.PI * (i - n4 * 2) / n4;
        for (let i = n4 * 3; i < n; i++)
            document.data.pitch[i] = Math.PI / 2 - Math.PI * (i - n4 * 3) / n4;
        drawData();
    }
}, {
    text: 'Dataset1 (change roll)',
    onselect: function () {
        document.data = JSON.parse(JSON.stringify(data1));
        var n = Object.keys(document.data.lat).length;
        let n4 = parseInt(n / 4);
        for (let i = 0; i < n4; i++)
            document.data.roll[i] = -Math.PI / 2 + Math.PI * i / n4;
        for (let i = n4; i < n4 * 2; i++)
            document.data.roll[i] = Math.PI / 2 - Math.PI * (i - n4) / n4;
        for (let i = n4 * 2; i < n4 * 3; i++)
            document.data.roll[i] = -Math.PI / 2 + Math.PI * (i - n4 * 2) / n4;
        for (let i = n4 * 3; i < n; i++)
            document.data.roll[i] = Math.PI / 2 - Math.PI * (i - n4 * 3) / n4;
        drawData();
    }
}, {
    text: 'Dataset1 (change pitch and roll)',
    onselect: function () {
        document.data = JSON.parse(JSON.stringify(data1));
        var n = Object.keys(document.data.lat).length;
        let n4 = parseInt(n / 4);
        for (let i = 0; i < n4; i++)
            document.data.pitch[i] = -Math.PI / 2 + Math.PI * i / n4;
        for (let i = n4; i < n4 * 2; i++)
            document.data.pitch[i] = Math.PI / 2 - Math.PI * (i - n4) / n4;
        for (let i = n4 * 2; i < n4 * 3; i++)
            document.data.pitch[i] = -Math.PI / 2 + Math.PI * (i - n4 * 2) / n4;
        for (let i = n4 * 3; i < n; i++)
            document.data.pitch[i] = Math.PI / 2 - Math.PI * (i - n4 * 3) / n4;
        for (let i = 0; i < n4; i++)
            document.data.roll[i] = -Math.PI / 2 + Math.PI * i / n4;
        for (let i = n4; i < n4 * 2; i++)
            document.data.roll[i] = Math.PI / 2 - Math.PI * (i - n4) / n4;
        for (let i = n4 * 2; i < n4 * 3; i++)
            document.data.roll[i] = -Math.PI / 2 + Math.PI * (i - n4 * 2) / n4;
        for (let i = n4 * 3; i < n; i++)
            document.data.roll[i] = Math.PI / 2 - Math.PI * (i - n4 * 3) / n4;
        drawData();
    }
}]);

Sandcastle.addToolbarMenu([{
    text: 'R = 50m',
    onselect: function () {
        document.R = 50;
        drawData();
    }
}, {
    text: 'R = 200m',
    onselect: function () {
        document.R = 200;
        drawData();
    }
}, {
    text: 'R = custom',
    onselect: function () {
        document.R = prompt("Please input R value in meters",50);
        drawData();
    }
}]);

Sandcastle.addToolbarMenu([{
    text: 'α = 45°',
    onselect: function () {
        document.alpha = 45;
        drawData();
    }
}]);

Sandcastle.addToolbarMenu([{
    text: '8 Angular Sections (only Yaw) in ECM',
    onselect: function () {
        document.angles = 8;
        // drawData();
    }
}, {
    text: '4 Angular Sections (only Yaw) in ECM',
    onselect: function () {
        document.angles = 4;
        // drawData();
    }
}, {
    text: '2 Angular Sections (only Yaw) in ECM',
    onselect: function () {
        document.angles = 2;
        // drawData();
    }
},
    {
        text: '16 Angular Sections (only Yaw) in ECM',
        onselect: function () {
            document.angles = 16;
            // drawData();
        }
    },
    {
        text: '4x4x4 Angular Sections in ECM',
        onselect: function () {
            document.angles = -4;
            // drawData();
        }
    }

]);

Sandcastle.addToolbarMenu([{
    text: '8x8x8 cells in WCM',
    onselect: function () {
        document.cells = 8;
        // drawData();
    }
}, {
    text: '4x4x4 cells in WCM',
    onselect: function () {
        document.cells = 4;
        // drawData();
    }
}, {
    text: '16x16x16 cells in WCM',
    onselect: function () {
        document.cells = 16;
        // drawData();
    }
}]);

Sandcastle.addToolbarMenu([

    {
        text: 'Camera downward',
        onselect: function () {
            document.camera = 0;
            drawData();
        }
    }, {
        text: 'Camera rightward',
        onselect: function () {
            document.camera = 1;
            drawData();
        }
    },
]);

document.angles = 8;
document.cells = 8;
document.R = 50;
document.alpha = 45;
document.camera = 0;
document.data = JSON.parse(JSON.stringify(data1));
var n = Object.keys(document.data.lat).length;



drawData();