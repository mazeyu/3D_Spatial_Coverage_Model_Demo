function addFlight(position, yaw, pitch, roll, convention) {

    var url = 'https://cesiumjs.org/releases/1.62/Apps/SampleData/models/CesiumAir/Cesium_Air.glb';

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

    return entity;
}


function addPyramid(index, lng, lat, hgt, yaw, pitch, roll, l0, alpha, convention) {

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
            let pos;
            if (document.camera === 0)
                pos = new Cesium.Cartesian3(i * Math.sin(alpha / 2), j * Math.sin(alpha / 2), Math.cos(alpha / 2));
            else if (document.camera === 1)
                pos = new Cesium.Cartesian3(j * Math.sin(alpha / 2), Math.cos(alpha / 2), i * Math.sin(alpha / 2));

            let new_pos = pos.clone();
            Cesium.Matrix3.multiplyByVector(m, pos, new_pos);



            let lngx = lng + new_pos.y * ly;
            let latx = lat + new_pos.x * lx;
            let hgtx = hgt - new_pos.z * l0;

            lngs.push(lngx);
            lats.push(latx);
            hgts.push(hgtx);
        }


    var bluePolygon;

    // if (index !== 157) {
        bluePolygon = viewer.entities.add({
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
    // } else {
    //     bluePolygon = viewer.entities.add({
    //         polygon: {
    //             hierarchy: Cesium.Cartesian3.fromDegreesArrayHeights([
    //                     lngs[0], lats[0], hgts[0],
    //                     lngs[1], lats[1], hgts[1],
    //                     lngs[2], lats[2], hgts[2],
    //                     lngs[0], lats[0], hgts[0],
    //                     lngs[2], lats[2], hgts[2],
    //                     lngs[4], lats[4], hgts[4],
    //                     lngs[0], lats[0], hgts[0],
    //                     lngs[4], lats[4], hgts[4],
    //                     lngs[3], lats[3], hgts[3],
    //                     lngs[0], lats[0], hgts[0],
    //                     lngs[3], lats[3], hgts[3],
    //                     lngs[1], lats[1], hgts[1],
    //                     lngs[1], lats[1], hgts[1],
    //                     lngs[2], lats[2], hgts[2],
    //                     lngs[3], lats[3], hgts[3],
    //                     lngs[3], lats[3], hgts[3],
    //                     lngs[2], lats[2], hgts[2],
    //                     lngs[4], lats[4], hgts[4],
    //
    //
    //                 ]
    //             ),
    //             // extrudedHeight: 0,
    //             perPositionHeight: true,
    //             material: Cesium.Color.RED.withAlpha(0.2),
    //             outline: true,
    //             outlineColor: Cesium.Color.WHITE
    //         }
    //     });
    // }

}


function drawData() {
    viewer.entities.removeAll();
    viewer.all_entities = [];
    var n = Object.keys(document.data.lat).length;

    for (let i = 0; i < n; i++) {
        let lat = document.data.lat[i];
        let lng = document.data.lng[i];
        let hgt = document.data.hgt[i];
        let yaw = document.data.yaw[i];
        let pitch = document.data.pitch[i];
        let roll = document.data.roll[i];

        var position = Cesium.Cartesian3.fromDegrees(lng, lat, hgt);

        viewer.all_entities.push(addFlight(position, yaw, pitch, roll, 2));
        // if (i === 157) {
        //     alert(157);
        // }
        addPyramid(i, lng, lat, hgt, yaw, pitch, roll, document.R, Cesium.Math.toRadians(document.alpha), 2)

    }

    viewer.zoomTo(viewer.entities);


}