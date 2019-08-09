function addFlight(position, yaw, pitch, roll, convention) {
    let q_pre = Cesium.Quaternion.fromHeadingPitchRoll(new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(-90), 0, 0));


    if (convention === undefined) {
        yaw = -yaw;
        pitch = -pitch;
        roll = -roll;
    }
    let q = Cesium.Quaternion.fromHeadingPitchRoll(new Cesium.HeadingPitchRoll(yaw, pitch, roll));
    if (convention === undefined) {
        let r = q.clone();
        Cesium.Quaternion.inverse(q, r);
        Cesium.Quaternion.multiply(q_pre, r, q);
    } else {
        Cesium.Quaternion.multiply(q_pre, q, q);
    }


    var hpr = Cesium.HeadingPitchRoll.fromQuaternion(q);
    var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

    var entity = viewer.entities.add({
        name: url,
        position: position,
        orientation: orientation,
        model: {
            uri: url,
            minimumPixelSize: 128,
            maximumScale: 20000
        }
    });

    return  entity;
}


function addPyramid(lng, lat, hgt, yaw, pitch, roll, l0, alpha, convention) {

    yaw = -yaw;
    pitch = -pitch;
    if (convention === undefined) {
        yaw = -yaw;
        pitch = -pitch;
        roll = -roll;
    }

    // alert(Math.cos(1));
    let l = 40076000;

    let lx = l0 / l * 360;
    let ly = l0 / l * 360 / Math.cos(Cesium.Math.toRadians(lat));

    let mt = Cesium.Matrix3.fromHeadingPitchRoll(new Cesium.HeadingPitchRoll(yaw, pitch, roll));
    let m = mt.clone();
    if (convention === undefined) Cesium.Matrix3.transpose(mt, m);

    let lngs = [lng];
    let lats = [lat];
    let hgts = [hgt];

    for (let i = -1; i < 2; i += 2)
        for (let j = -1; j < 2; j += 2) {
            let pos = new Cesium.Cartesian3(i * Math.sin(alpha / 2), j * Math.sin(alpha / 2), Math.cos(alpha / 2));
            let new_pos = pos.clone();
            Cesium.Matrix3.multiplyByVector(m, pos, new_pos);


            let lngx = lng + new_pos.y * ly;
            let latx = lat + new_pos.x * lx;
            let hgtx = hgt - new_pos.z * l0;

            lngs.push(lngx);
            lats.push(latx);
            hgts.push(hgtx);
        }


    var bluePolygon = viewer.entities.add({
        polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArrayHeights([
                    lngs[0], lats[0], hgts[0],
                    lngs[1], lats[1], hgts[1],
                    lngs[2], lats[2], hgts[2],
                lngs[0], lats[0], hgts[0],
                lngs[2], lats[2], hgts[2],
                lngs[4], lats[4], hgts[4],
                lngs[0], lats[0], hgts[0],
                lngs[4], lats[4], hgts[4],
                lngs[3], lats[3], hgts[3],
                lngs[0], lats[0], hgts[0],
                lngs[3], lats[3], hgts[3],
                lngs[1], lats[1], hgts[1],
                lngs[1], lats[1], hgts[1],
                lngs[2], lats[2], hgts[2],
                lngs[3], lats[3], hgts[3],
                lngs[3], lats[3], hgts[3],
                lngs[2], lats[2], hgts[2],
                lngs[4], lats[4], hgts[4],


                ]
            ),
            // extrudedHeight: 0,
            perPositionHeight: true,
            material: Cesium.Color.BLUE.withAlpha(0.2),
            outline: true,
            outlineColor: Cesium.Color.WHITE
        }
    });

}

function addAxes(lng, lat, hgt, yaw, pitch, roll, convention) {


    yaw = -yaw;
    pitch = -pitch;
    if (convention === undefined) {
        yaw = -yaw;
        pitch = -pitch;
        roll = -roll;
    }

    // alert(Math.cos(1));
    let l = 40076000;
    let l0 = 500;
    let lx = l0 / l * 360;
    let ly = l0 / l * 360 / Math.cos(Cesium.Math.toRadians(lat));

    let mt = Cesium.Matrix3.fromHeadingPitchRoll(new Cesium.HeadingPitchRoll(yaw, pitch, roll));
    let m = mt.clone();
    if (convention === undefined) Cesium.Matrix3.transpose(mt, m);

    m[0] = m[0] * lx;
    m[3] = m[3] * lx;
    m[6] = m[6] * lx;
    m[1] = m[1] * ly;
    m[4] = m[4] * ly;
    m[7] = m[7] * ly;
    m[2] = m[2] * l0;
    m[5] = m[5] * l0;
    m[8] = m[8] * l0;


    let lngx = lng + m[1];
    let latx = lat + m[0];
    let hgtx = hgt - m[2];

    let lngy = lng + m[4];
    let laty = lat + m[3];
    let hgty = hgt - m[5];

    let lngz = lng + m[7];
    let latz = lat + m[6];
    let hgtz = hgt - m[8];


    var Arrowx = viewer.entities.add({
        name: 'Purple straight arrow at height',
        polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([lng, lat, hgt,
                lngx, latx, hgtx]),
            width: 10,
            arcType: Cesium.ArcType.NONE,
            material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.RED)
        }
    });


    var Arrowy = viewer.entities.add({
        name: 'Purple straight arrow at height',
        polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([lng, lat, hgt,
                lngy, laty, hgty]),
            width: 10,
            arcType: Cesium.ArcType.NONE,
            material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.RED)
        }
    });


    var Arrowz = viewer.entities.add({
        name: 'Purple straight arrow at height',
        polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([lng, lat, hgt,
                lngz, latz, hgtz]),
            width: 10,
            arcType: Cesium.ArcType.NONE,
            material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.RED)
        }
    });

    var labelX = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lngx, latx, hgtx),
        label: {
            text: 'X axis',
            font: '14pt monospace',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            pixelOffset: new Cesium.Cartesian2(0, -9)
        }
    });

    var labelY = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lngy, laty, hgty),
        label: {
            text: 'Y axis',
            font: '14pt monospace',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            pixelOffset: new Cesium.Cartesian2(0, -9)
        }
    });

    var labelZ = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lngz, latz, hgtz),
        label: {
            text: 'Z axis',
            font: '14pt monospace',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            pixelOffset: new Cesium.Cartesian2(0, -9)
        }
    });

}

//
// function changeQuery() {
//
//     let lat = parseFloat(document.getElementById('lat').value);
//     let lng = parseFloat(document.getElementById('lng').value);
//     let hgt = parseFloat(document.getElementById('hgt').value);
//
//
//
//     let size0 = parseFloat(document.getElementById('size').value);
//     let size1 = parseFloat(document.getElementById('size').value);
//     let size2 = parseFloat(document.getElementById('size').value);
//
//
//
//     let newBox = viewer.entities.add({
//         position: Cesium.Cartesian3.fromDegrees(lng, lat, hgt),
//         box: {
//             dimensions: new Cesium.Cartesian3(size0, size1, size2),
//             material: Cesium.Color.RED.withAlpha(0.5),
//             outline: true,
//             outlineColor: Cesium.Color.BLACK
//         }
//     });
//
//     if (viewer.QueryBox.length > 0) {
//         viewer.entities.remove(viewer.QueryBox[0]);
//         viewer.QueryBox = viewer.QueryBox.slice(1, viewer.QueryBox.length);
//     }
//     viewer.QueryBox.push(newBox);
//     viewer.zoomTo(newBox);
//
//     document.getElementById('inp').value = lat + " " + lng + " " + hgt + " " + size0;
//
//
// }


function displayOneQuery() {
    if (viewer.queryTot === viewer.queryCur) {
        // viewer.entities.remove(viewer.QueryBox[0]);
        window.clearInterval(viewer.timer);
        return;
    }
    let frame = viewer.queryLines[viewer.queryCur].split(' ');
    viewer.queryCur += 1;
    let lat = parseFloat(frame[0]);

    let lng = parseFloat(frame[1]);

    let hgt = parseFloat(frame[2]);

    // document.getElementById('lat').value = lat;
    // document.getElementById('lng').value = lng;
    // document.getElementById('hgt').value = hgt;



    let size0 = parseFloat(frame[3]);
    // document.getElementById('size').value = size0;

    let size1 = parseFloat(frame[4]);
    let size2 = parseFloat(frame[5]);


    let ans1 = parseFloat(frame[6]);
    let ans2 = parseFloat(frame[7]);
    let ans3 = parseFloat(frame[8]);

    // if (viewer.label !== undefined) viewer.entities.remove(viewer.label);
    //
    // viewer.label = viewer.entities.add({
    //     position: Cesium.Cartesian3.fromDegrees(lng, lat, hgt + size2 / 2),
    //     label: {
    //         text: 'X axis',
    //         font: '20pt monospace',
    //         style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    //         outlineWidth: 2,
    //         pixelOffset: new Cesium.Cartesian2(0, -9)
    //     }
    // });
    document.getElementById("ans1").textContent = "Coverage using Volume Coverage Model: \n" + (ans1 * 100).toFixed(2) + "%";
    document.getElementById("ans2").textContent = "Coverage using Euler-based Directional Coverage Model: \n" + (ans2 * 100).toFixed(2) + "%";
    document.getElementById("ans3").textContent = "Coverage using Weighted Cell Coverage Model: \n" + (ans3 * 100).toFixed(2) + "%";


    let newBox = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lng, lat, hgt),
        box: {
            dimensions: new Cesium.Cartesian3(size0, size1, size2),
            material: Cesium.Color.RED.withAlpha(0.5),
            outline: true,
            outlineColor: Cesium.Color.BLACK
        }
    });

    if (viewer.QueryBox.length > 0) {
        viewer.entities.remove(viewer.QueryBox[0]);
        viewer.QueryBox = viewer.QueryBox.slice(1, viewer.QueryBox.length);
    }
    viewer.QueryBox.push(newBox);
    viewer.zoomTo(newBox);

}

function addQuery() {


    var fileVal = document.getElementById("query").files[0];
    var fileName = fileVal.name;
    var reader = new FileReader();
    reader.readAsText(fileVal, 'gb2312');
    reader.onload = function () {
        var text = this.result;

        viewer.queryLines = text.split('\n');

        viewer.queryTot = viewer.queryLines.length - 1;
        viewer.queryCur = 0;
        if (viewer.QueryBox !== undefined && viewer.QueryBox.length !== 0) {
            viewer.entities.remove(viewer.QueryBox[0]);
        }
        viewer.QueryBox = [];
        viewer.timer = window.setInterval("displayOneQuery()",1000);
    };
}

function addData() {
    viewer.entities.removeAll();


    var fileVal = document.getElementById("data").files[0];
    var fileName = fileVal.name;
    var reader = new FileReader();
    reader.readAsText(fileVal, 'gb2312');
    reader.onload = function () {
        var text = this.result;

        var lines = text.split('\n');
        let tot = lines.length;

        document.getElementById("cnt").textContent = "total number of frames: " + (tot - 1).toString();
        let step = parseInt(document.getElementById('step').value);
        let start = parseInt(document.getElementById('start').value);
        let end = parseInt(document.getElementById('end').value);

        let R = parseFloat(document.getElementById('R').value);
        let alpha = parseFloat(document.getElementById('alpha').value);

        viewer.all_entities = [];

        for (let i = start + 1; i < end + 1; i += step) {
            let frame = lines[i].split(',');
            let lat = parseFloat(frame[0]);
            let lng = parseFloat(frame[1]);
            let hgt = parseFloat(frame[2]);
            let yaw = parseFloat(frame[3]);
            let pitch = parseFloat(frame[4]);
            let roll = parseFloat(frame[5]);

            var position = Cesium.Cartesian3.fromDegrees(lng, lat, hgt);

            viewer.all_entities.push(addFlight(position, yaw, pitch, roll, 2));
            addPyramid(lng, lat, hgt, yaw, pitch, roll, R, Cesium.Math.toRadians(alpha), 2)

        }

        viewer.zoomTo(viewer.entities);
        viewer.currentEntity = 0;

    };
    //
    // var intervalId = window.setInterval(function() {
    //     viewer.zoomTo(viewer.all_entities[viewer.currentEntity]);
    //     viewer.currentEntity += 1;
    // }, 100)

}

function follow() {
    viewer.zoomTo(viewer.all_entities[viewer.currentEntity]);
    viewer.currentEntity += 1;
}