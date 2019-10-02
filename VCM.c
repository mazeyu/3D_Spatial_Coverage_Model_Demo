#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <emscripten/emscripten.h>
#include <math.h>

#define M 1000

// 一旦WASM模块被加载，main()中的代码就会执行
#define N 200

double lat[N], lng[N], hgt[N], yaw[N], pitch[N], roll[N];


struct box {
    double a[3][2];
};

struct point3 {
    double a[3];
};

struct points53 {
    struct point3 a[5];
};


double det(double a[3][3]) {
    return a[0][0] * a[1][1] * a[2][2] - a[0][0] * a[1][2] * a[2][1] +
           a[0][1] * a[1][2] * a[2][0] - a[0][1] * a[1][0] * a[2][2] +
           a[0][2] * a[1][0] * a[2][1] - a[0][2] * a[1][1] * a[2][0];
}


double
        EMSCRIPTEN_KEEPALIVE

VCM(double *lat, double *lng, double *hgt, double *yaw, double *pitch, double *roll, int cnt,
    double R, double alpha, int camera,
    double querylat, double querylng, double queryhgt, double querys0, double querys1, double querys2) {

//    bool extrinsic = true;


    struct points53 *points = (struct points53 *) malloc(cnt * sizeof(struct points53));
    struct box *bds = (struct box *) malloc(cnt * sizeof(struct box));

    double lat_min, lat_max, lat_scale;
    double lng_min, lng_max, lng_scale;
    double hgt_min, hgt_max, hgt_scale;
    double x_center, y_center, z_center;

    struct box bound;


    lat_min = 1e9;
    lat_max = -1e9;
    lng_min = 1e9;
    lng_max = -1e9;
    hgt_min = 1e9;
    hgt_max = -1e9;

    for (int i = 0; i < cnt; i++) {
        if (lat[i] < lat_min) lat_min = lat[i];
        if (lat[i] > lat_max) lat_max = lat[i];
        if (lng[i] < lng_min) lng_min = lng[i];
        if (lng[i] > lng_max) lng_max = lng[i];
        if (hgt[i] < hgt_min) hgt_min = hgt[i];
        if (hgt[i] > hgt_max) hgt_max = hgt[i];
    }

//    cout << "mean latitude: " << (lat_min + lat_max) / 2 << endl;
//    cout << "mean longitude: " << (lng_min + lng_max) / 2 << endl;

    lat_scale = 40075.017 / 360 * 1000;
    lng_scale = 40075.017 / 360 * 1000 * cos((lat_min + lat_max) / 2 * acos(-1) / 180);
    hgt_scale = 1;
    x_center = (lng_max + lng_min) / 2 * lng_scale;
    y_center = (lat_max + lat_min) / 2 * lat_scale;
    z_center = (hgt_max + hgt_min) / 2 * hgt_scale;

//    cout << lng_scale << " " << lat_scale << endl;
//    cout << x_center << " " << y_center << " " << z_center;
    for (int i = 0; i < 3; i++) {
        bound.a[i][0] = 1e9;
        bound.a[i][1] = -1e9;
    }
    for (int i = 0; i < cnt; i++) {
        for (int k = 0; k < 3; k++) points[i].a[0].a[k] = 0;
        double phi = yaw[i], theta = pitch[i], psi = roll[i];
//        if (!extrinsic) {
//            phi = -phi;
//            theta = -theta;
//            psi = -psi;
//        }
        double Rot[3][3];
        Rot[0][0] = cos(theta) * cos(phi);
        Rot[0][1] = cos(theta) * sin(phi);
        Rot[0][2] = -sin(theta);
        Rot[1][0] = sin(psi) * sin(theta) * cos(phi) - cos(psi) * sin(phi);
        Rot[1][1] = sin(psi) * sin(theta) * sin(phi) + cos(psi) * cos(phi);
        Rot[1][2] = sin(psi) * cos(theta);
        Rot[2][0] = cos(psi) * sin(theta) * cos(phi) + sin(psi) * sin(phi);
        Rot[2][1] = cos(psi) * sin(theta) * sin(phi) - sin(psi) * cos(phi);
        Rot[2][2] = cos(psi) * cos(theta);
//        if (!extrinsic) {
//            for (int j = 0; j < 3; j++)
//                for (int k = j; k < 3; k++)
//                    swap(Rot[j][k], Rot[k][j]);
//
//        }
        for (int j = 0; j < 2; j++)
            for (int k = 0; k < 2; k++) {
                if (camera == 1) {
                    points[i].a[j * 2 + k + 1].a[0] = (k * 2 - 1) * R * sin(alpha / 2 * acos(-1) / 180);
                    points[i].a[j * 2 + k + 1].a[1] = -R * cos(alpha / 2 * acos(-1) / 180);
                    points[i].a[j * 2 + k + 1].a[2] = (j * 2 - 1) * R * sin(alpha / 2 * acos(-1) / 180);
                } else if (camera == 0) {
                    points[i].a[j * 2 + k + 1].a[0] = (j * 2 - 1) * R * sin(alpha / 2 * acos(-1) / 180);
                    points[i].a[j * 2 + k + 1].a[1] = (k * 2 - 1) * R * sin(alpha / 2 * acos(-1) / 180);
                    points[i].a[j * 2 + k + 1].a[2] = -R * cos(alpha / 2 * acos(-1) / 180);
                }
            }
        for (int j = 0; j < 5; j++) {
            double p[3] = {0};
            for (int k = 0; k < 3; k++)
                for (int l = 0; l < 3; l++)
                    p[k] += Rot[l][k] * points[i].a[j].a[l];
            for (int k = 0; k < 3; k++) points[i].a[j].a[k] = p[k];
        }
        for (int j = 0; j < 3; j++) {
            bds[i].a[j][0] = 1e9;
            bds[i].a[j][1] = -1e9;
        }
        if (i == 0) {
            for (int j = 0; j < 5; j++) {
                for (int k = 0; k < 3; k++)
                    printf("%lf ", points[i].a[j].a[k]);
                printf("\n");
            }
        }

        for (int j = 0; j < 5; j++) {
//            double tmp = points[i].a[j].a[0];
            points[i].a[j].a[0] *= -1;
            points[i].a[j].a[1] *= -1;
            points[i].a[j].a[0] += lng[i] * lng_scale - x_center;
            points[i].a[j].a[1] += lat[i] * lat_scale - y_center;
            points[i].a[j].a[2] += hgt[i] * hgt_scale - z_center;
            for (int k = 0; k < 3; k++) {
                if (points[i].a[j].a[k] < bound.a[k][0]) bound.a[k][0] = points[i].a[j].a[k];
                if (points[i].a[j].a[k] > bound.a[k][1]) bound.a[k][1] = points[i].a[j].a[k];
                if (points[i].a[j].a[k] < bds[i].a[k][0]) bds[i].a[k][0] = points[i].a[j].a[k];
                if (points[i].a[j].a[k] > bds[i].a[k][1]) bds[i].a[k][1] = points[i].a[j].a[k];
            }
//            cout << points[i][j][2] + z_center << " " << endl;
        }


    }


    int faces[6][3] = {2, 1, 0, 4, 2, 0, 3, 4, 0, 1, 3, 0, 1, 2, 3, 3, 2, 4};


    int iter = 1000;

    int *index = (int *) malloc(cnt * sizeof(int));
    int cnt_index = 0;


    struct box q;
    q.a[0][0] = querylng * lng_scale - x_center - querys0 / 2;
    q.a[0][1] = querylng * lng_scale - x_center + querys0 / 2;
    q.a[1][0] = querylat * lat_scale - y_center - querys1 / 2;
    q.a[1][1] = querylat * lat_scale - y_center + querys1 / 2;
    q.a[2][0] = queryhgt * hgt_scale - z_center - querys2 / 2;
    q.a[2][1] = queryhgt * hgt_scale - z_center + querys2 / 2;


    for (int i = 0; i < cnt; i++) {
        int flag[3];
        for (int j = 0; j < 3; j++) flag[j] = bds[i].a[j][0] > q.a[j][1] || bds[i].a[j][1] < q.a[j][0];
        if (flag[0] || flag[1] || flag[2]) continue;
        index[cnt_index++] = i;
    }

//    return cnt_index;
//    cout << "size: " << index.size() << endl;



    int hit = 0;
    for (int it = 0; it < iter; it++) {
        double pt[3];
        for (int i = 0; i < 3; i++)
            pt[i] = q.a[i][0] + (q.a[i][1] - q.a[i][0]) * (rand() % M) / M;

        for (int ii = 0; ii < cnt_index; ii++) {
            int i = index[ii];
            int flag = 1;
            for (int j = 0; j < 6; j++) {
                double a[3][3];
                for (int k = 0; k < 3; k++)
                    for (int p = 0; p < 3; p++)
                        a[k][p] = points[i].a[faces[j][k]].a[p] - pt[p];
                double v = det(a);
                if (v < 0) {
                    flag = 0;
                    break;
                }
            }
            if (flag) {
//                printf("%d\n", i);
                hit++;
                break;
            }
        }
    }
    return hit * 1.0 / iter;


}

double
        EMSCRIPTEN_KEEPALIVE

ECM(double *lat, double *lng, double *hgt, double *yaw, double *pitch, double *roll, int cnt,
    double R, double alpha, int camera,
    double querylat, double querylng, double queryhgt, double querys0, double querys1, double querys2,
    int angles) {

//    bool extrinsic = true;


    struct points53 *points = (struct points53 *) malloc(cnt * sizeof(struct points53));
    struct box *bds = (struct box *) malloc(cnt * sizeof(struct box));

    double lat_min, lat_max, lat_scale;
    double lng_min, lng_max, lng_scale;
    double hgt_min, hgt_max, hgt_scale;
    double x_center, y_center, z_center;

    struct box bound;


    lat_min = 1e9;
    lat_max = -1e9;
    lng_min = 1e9;
    lng_max = -1e9;
    hgt_min = 1e9;
    hgt_max = -1e9;

    for (int i = 0; i < cnt; i++) {
        if (lat[i] < lat_min) lat_min = lat[i];
        if (lat[i] > lat_max) lat_max = lat[i];
        if (lng[i] < lng_min) lng_min = lng[i];
        if (lng[i] > lng_max) lng_max = lng[i];
        if (hgt[i] < hgt_min) hgt_min = hgt[i];
        if (hgt[i] > hgt_max) hgt_max = hgt[i];
    }

//    cout << "mean latitude: " << (lat_min + lat_max) / 2 << endl;
//    cout << "mean longitude: " << (lng_min + lng_max) / 2 << endl;

    lat_scale = 40075.017 / 360 * 1000;
    lng_scale = 40075.017 / 360 * 1000 * cos((lat_min + lat_max) / 2 * acos(-1) / 180);
    hgt_scale = 1;
    x_center = (lng_max + lng_min) / 2 * lng_scale;
    y_center = (lat_max + lat_min) / 2 * lat_scale;
    z_center = (hgt_max + hgt_min) / 2 * hgt_scale;

//    cout << lng_scale << " " << lat_scale << endl;
//    cout << x_center << " " << y_center << " " << z_center;
    for (int i = 0; i < 3; i++) {
        bound.a[i][0] = 1e9;
        bound.a[i][1] = -1e9;
    }
    for (int i = 0; i < cnt; i++) {
        for (int k = 0; k < 3; k++) points[i].a[0].a[k] = 0;
        double phi = yaw[i], theta = pitch[i], psi = roll[i];
//        if (!extrinsic) {
//            phi = -phi;
//            theta = -theta;
//            psi = -psi;
//        }
        double Rot[3][3];
        Rot[0][0] = cos(theta) * cos(phi);
        Rot[0][1] = cos(theta) * sin(phi);
        Rot[0][2] = -sin(theta);
        Rot[1][0] = sin(psi) * sin(theta) * cos(phi) - cos(psi) * sin(phi);
        Rot[1][1] = sin(psi) * sin(theta) * sin(phi) + cos(psi) * cos(phi);
        Rot[1][2] = sin(psi) * cos(theta);
        Rot[2][0] = cos(psi) * sin(theta) * cos(phi) + sin(psi) * sin(phi);
        Rot[2][1] = cos(psi) * sin(theta) * sin(phi) - sin(psi) * cos(phi);
        Rot[2][2] = cos(psi) * cos(theta);
//        if (!extrinsic) {
//            for (int j = 0; j < 3; j++)
//                for (int k = j; k < 3; k++)
//                    swap(Rot[j][k], Rot[k][j]);
//
//        }
        for (int j = 0; j < 2; j++)
            for (int k = 0; k < 2; k++) {
                if (camera == 1) {
                    points[i].a[j * 2 + k + 1].a[0] = (k * 2 - 1) * R * sin(alpha / 2 * acos(-1) / 180);
                    points[i].a[j * 2 + k + 1].a[1] = -R * cos(alpha / 2 * acos(-1) / 180);
                    points[i].a[j * 2 + k + 1].a[2] = (j * 2 - 1) * R * sin(alpha / 2 * acos(-1) / 180);
                } else if (camera == 0) {
                    points[i].a[j * 2 + k + 1].a[0] = (j * 2 - 1) * R * sin(alpha / 2 * acos(-1) / 180);
                    points[i].a[j * 2 + k + 1].a[1] = (k * 2 - 1) * R * sin(alpha / 2 * acos(-1) / 180);
                    points[i].a[j * 2 + k + 1].a[2] = -R * cos(alpha / 2 * acos(-1) / 180);
                }
            }
        for (int j = 0; j < 5; j++) {
            double p[3] = {0};
            for (int k = 0; k < 3; k++)
                for (int l = 0; l < 3; l++)
                    p[k] += Rot[l][k] * points[i].a[j].a[l];
            for (int k = 0; k < 3; k++) points[i].a[j].a[k] = p[k];
        }
        for (int j = 0; j < 3; j++) {
            bds[i].a[j][0] = 1e9;
            bds[i].a[j][1] = -1e9;
        }
        for (int j = 0; j < 5; j++) {
//            double tmp = points[i].a[j].a[0];
            points[i].a[j].a[0] *= -1;
            points[i].a[j].a[1] *= -1;
            points[i].a[j].a[0] += lng[i] * lng_scale - x_center;
            points[i].a[j].a[1] += lat[i] * lat_scale - y_center;
            points[i].a[j].a[2] += hgt[i] * hgt_scale - z_center;
            for (int k = 0; k < 3; k++) {
                if (points[i].a[j].a[k] < bound.a[k][0]) bound.a[k][0] = points[i].a[j].a[k];
                if (points[i].a[j].a[k] > bound.a[k][1]) bound.a[k][1] = points[i].a[j].a[k];
                if (points[i].a[j].a[k] < bds[i].a[k][0]) bds[i].a[k][0] = points[i].a[j].a[k];
                if (points[i].a[j].a[k] > bds[i].a[k][1]) bds[i].a[k][1] = points[i].a[j].a[k];
            }
//            cout << points[i][j][2] + z_center << " " << endl;
        }

    }


    int faces[6][3] = {2, 1, 0, 4, 2, 0, 3, 4, 0, 1, 3, 0, 1, 2, 3, 3, 2, 4};
    int usePR = 0;
    if (angles < 0) {
        angles *= -1;
        usePR = 1;
    }


//    int angles = 8;
    int iter = 1000 / (usePR ? (angles * angles * angles) : angles);

    int *index[16 * 16 * 16];
    for (int i = 0; i < (usePR ? (angles * angles * angles) : angles); i++)
        index[i] = (int *) malloc(cnt * sizeof(int));
    int cnt_index[16 * 16 * 16] = {0};


    struct box q;
    q.a[0][0] = querylng * lng_scale - x_center - querys0 / 2;
    q.a[0][1] = querylng * lng_scale - x_center + querys0 / 2;
    q.a[1][0] = querylat * lat_scale - y_center - querys1 / 2;
    q.a[1][1] = querylat * lat_scale - y_center + querys1 / 2;
    q.a[2][0] = queryhgt * hgt_scale - z_center - querys2 / 2;
    q.a[2][1] = queryhgt * hgt_scale - z_center + querys2 / 2;


    for (int i = 0; i < cnt; i++) {
        int flag[3];
        for (int j = 0; j < 3; j++) flag[j] = bds[i].a[j][0] > q.a[j][1] || bds[i].a[j][1] < q.a[j][0];
        if (flag[0] || flag[1] || flag[2]) continue;
        int discAngle;
        if (!usePR) discAngle = (int) ((yaw[i] + acos(-1)) / (2 * acos(-1)) * angles);
        else {
            int d1 = (int) ((yaw[i] + acos(-1)) / (2 * acos(-1)) * angles),
                    d2 = (int) ((pitch[i] + acos(-1) / 2) / (acos(-1)) * angles),
                    d3 = (int) ((roll[i] + acos(-1) / 2) / (acos(-1)) * angles);
            discAngle = d1 * angles * angles + d2 * angles + d3;
        }

        index[discAngle][cnt_index[discAngle]++] = i;
    }


    int hit = 0;
    for (int it = 0; it < iter; it++) {
        double pt[3];
        for (int i = 0; i < 3; i++)
            pt[i] = q.a[i][0] + (q.a[i][1] - q.a[i][0]) * (rand() % M) / M;

        for (int angle = 0; angle < (usePR ? (angles * angles * angles) : angles); angle++)
            for (int ii = 0; ii < cnt_index[angle]; ii++) {
                int i = index[angle][ii];
                int flag = 1;
                for (int j = 0; j < 6; j++) {
                    double a[3][3];
                    for (int k = 0; k < 3; k++)
                        for (int p = 0; p < 3; p++)
                            a[k][p] = points[i].a[faces[j][k]].a[p] - pt[p];
                    double v = det(a);
                    if (v < 0) {
                        flag = 0;
                        break;
                    }
                }
                if (flag) {
                    hit++;
                    break;
                }
            }
    }
    return hit * 1.0 / iter / (usePR ? (angles * angles * angles) : angles);


}

double sqr(double x) {
    return x * x;
}

double
        EMSCRIPTEN_KEEPALIVE

WCM(double *lat, double *lng, double *hgt, double *yaw, double *pitch, double *roll, int cnt,
    double R, double alpha, int camera,
    double querylat, double querylng, double queryhgt, double querys0, double querys1, double querys2,
    int angles, int cells) {

//    bool extrinsic = true;


    struct points53 *points = (struct points53 *) malloc(cnt * sizeof(struct points53));
    struct box *bds = (struct box *) malloc(cnt * sizeof(struct box));

    double lat_min, lat_max, lat_scale;
    double lng_min, lng_max, lng_scale;
    double hgt_min, hgt_max, hgt_scale;
    double x_center, y_center, z_center;

    struct box bound;


    lat_min = 1e9;
    lat_max = -1e9;
    lng_min = 1e9;
    lng_max = -1e9;
    hgt_min = 1e9;
    hgt_max = -1e9;

    for (int i = 0; i < cnt; i++) {
        if (lat[i] < lat_min) lat_min = lat[i];
        if (lat[i] > lat_max) lat_max = lat[i];
        if (lng[i] < lng_min) lng_min = lng[i];
        if (lng[i] > lng_max) lng_max = lng[i];
        if (hgt[i] < hgt_min) hgt_min = hgt[i];
        if (hgt[i] > hgt_max) hgt_max = hgt[i];
    }

//    cout << "mean latitude: " << (lat_min + lat_max) / 2 << endl;
//    cout << "mean longitude: " << (lng_min + lng_max) / 2 << endl;

    lat_scale = 40075.017 / 360 * 1000;
    lng_scale = 40075.017 / 360 * 1000 * cos((lat_min + lat_max) / 2 * acos(-1) / 180);
    hgt_scale = 1;
    x_center = (lng_max + lng_min) / 2 * lng_scale;
    y_center = (lat_max + lat_min) / 2 * lat_scale;
    z_center = (hgt_max + hgt_min) / 2 * hgt_scale;

//    cout << lng_scale << " " << lat_scale << endl;
//    cout << x_center << " " << y_center << " " << z_center;
    for (int i = 0; i < 3; i++) {
        bound.a[i][0] = 1e9;
        bound.a[i][1] = -1e9;
    }
    for (int i = 0; i < cnt; i++) {
        for (int k = 0; k < 3; k++) points[i].a[0].a[k] = 0;
        double phi = yaw[i], theta = pitch[i], psi = roll[i];
//        if (!extrinsic) {
//            phi = -phi;
//            theta = -theta;
//            psi = -psi;
//        }
        double Rot[3][3];
        Rot[0][0] = cos(theta) * cos(phi);
        Rot[0][1] = cos(theta) * sin(phi);
        Rot[0][2] = -sin(theta);
        Rot[1][0] = sin(psi) * sin(theta) * cos(phi) - cos(psi) * sin(phi);
        Rot[1][1] = sin(psi) * sin(theta) * sin(phi) + cos(psi) * cos(phi);
        Rot[1][2] = sin(psi) * cos(theta);
        Rot[2][0] = cos(psi) * sin(theta) * cos(phi) + sin(psi) * sin(phi);
        Rot[2][1] = cos(psi) * sin(theta) * sin(phi) - sin(psi) * cos(phi);
        Rot[2][2] = cos(psi) * cos(theta);
//        if (!extrinsic) {
//            for (int j = 0; j < 3; j++)
//                for (int k = j; k < 3; k++)
//                    swap(Rot[j][k], Rot[k][j]);
//
//        }
        for (int j = 0; j < 2; j++)
            for (int k = 0; k < 2; k++) {
                if (camera == 1) {
                    points[i].a[j * 2 + k + 1].a[0] = (k * 2 - 1) * R * sin(alpha / 2 * acos(-1) / 180);
                    points[i].a[j * 2 + k + 1].a[1] = -R * cos(alpha / 2 * acos(-1) / 180);
                    points[i].a[j * 2 + k + 1].a[2] = (j * 2 - 1) * R * sin(alpha / 2 * acos(-1) / 180);
                } else if (camera == 0) {
                    points[i].a[j * 2 + k + 1].a[0] = (j * 2 - 1) * R * sin(alpha / 2 * acos(-1) / 180);
                    points[i].a[j * 2 + k + 1].a[1] = (k * 2 - 1) * R * sin(alpha / 2 * acos(-1) / 180);
                    points[i].a[j * 2 + k + 1].a[2] = -R * cos(alpha / 2 * acos(-1) / 180);
                }
            }
        for (int j = 0; j < 5; j++) {
            double p[3] = {0};
            for (int k = 0; k < 3; k++)
                for (int l = 0; l < 3; l++)
                    p[k] += Rot[l][k] * points[i].a[j].a[l];
            for (int k = 0; k < 3; k++) points[i].a[j].a[k] = p[k];
        }
        for (int j = 0; j < 3; j++) {
            bds[i].a[j][0] = 1e9;
            bds[i].a[j][1] = -1e9;
        }
        for (int j = 0; j < 5; j++) {
//            double tmp = points[i].a[j].a[0];
            points[i].a[j].a[0] *= -1;
            points[i].a[j].a[1] *= -1;
            points[i].a[j].a[0] += lng[i] * lng_scale - x_center;
            points[i].a[j].a[1] += lat[i] * lat_scale - y_center;
            points[i].a[j].a[2] += hgt[i] * hgt_scale - z_center;
            for (int k = 0; k < 3; k++) {
                if (points[i].a[j].a[k] < bound.a[k][0]) bound.a[k][0] = points[i].a[j].a[k];
                if (points[i].a[j].a[k] > bound.a[k][1]) bound.a[k][1] = points[i].a[j].a[k];
                if (points[i].a[j].a[k] < bds[i].a[k][0]) bds[i].a[k][0] = points[i].a[j].a[k];
                if (points[i].a[j].a[k] > bds[i].a[k][1]) bds[i].a[k][1] = points[i].a[j].a[k];
            }
//            cout << points[i][j][2] + z_center << " " << endl;
        }

    }


    int faces[6][3] = {2, 1, 0, 4, 2, 0, 3, 4, 0, 1, 3, 0, 1, 2, 3, 3, 2, 4};


    int *index[16 * 16 * 16];
    int usePR = 0;
    if (angles < 0) {
        angles *= -1;
        usePR = 1;
    }

    for (int i = 0; i < (usePR ? (angles * angles * angles) : angles); i++)
        index[i] = (int *) malloc(cnt * sizeof(int));
    int cnt_index[16 * 16 * 16] = {0};


    struct box q;
    q.a[0][0] = querylng * lng_scale - x_center - querys0 / 2;
    q.a[0][1] = querylng * lng_scale - x_center + querys0 / 2;
    q.a[1][0] = querylat * lat_scale - y_center - querys1 / 2;
    q.a[1][1] = querylat * lat_scale - y_center + querys1 / 2;
    q.a[2][0] = queryhgt * hgt_scale - z_center - querys2 / 2;
    q.a[2][1] = queryhgt * hgt_scale - z_center + querys2 / 2;


    for (int i = 0; i < cnt; i++) {
        int flag[3];
        for (int j = 0; j < 3; j++) flag[j] = bds[i].a[j][0] > q.a[j][1] || bds[i].a[j][1] < q.a[j][0];
        if (flag[0] || flag[1] || flag[2]) continue;
        int discAngle;
        if (!usePR) discAngle = (int) ((yaw[i] + acos(-1)) / (2 * acos(-1)) * angles);
        else {
            int d1 = (int) ((yaw[i] + acos(-1)) / (2 * acos(-1)) * angles),
                    d2 = (int) ((pitch[i] + acos(-1) / 2) / (acos(-1)) * angles),
                    d3 = (int) ((roll[i] + acos(-1) / 2) / (acos(-1)) * angles);
            discAngle = d1 * angles * angles + d2 * angles + d3;
        }
        index[discAngle][cnt_index[discAngle]++] = i;
    }

    double weights[16][16][16];
    for (int i = 0; i < cells; i++)
        for (int j = 0; j < cells; j++)
            for (int k = 0; k < cells; k++) {
                double center[3];
                center[0] = q.a[0][0] + (q.a[0][1] - q.a[0][0]) * (i + 0.5) / cells;
                center[1] = q.a[1][0] + (q.a[1][1] - q.a[1][0]) * (j + 0.5) / cells;
                center[2] = q.a[2][0] + (q.a[2][1] - q.a[2][0]) * (k + 0.5) / cells;
                double sum = 0;
                int cnt_ = 0;
                for (int angle = 0; angle < (usePR ? (angles * angles * angles) : angles); angle++)
                    for (int in_ = 0; in_ < cnt_index[angle]; in_++) {
                        int in = index[angle][in_];
                        double dis = sqrt(sqr(center[0] - points[in].a[0].a[0]) + sqr(center[1] - points[in].a[0].a[1])
                                          + sqr(center[2] - points[in].a[0].a[2]));
                        if (dis < R) {
                            sum += dis;
                            cnt_++;
                        }
                    }
                weights[i][j][k] = cnt_ ? (1 - sum / cnt_ / R) : 0;
            }

    int iter = (int) (1000.0 / cells / cells / cells / (usePR ? (angles * angles * angles) : angles) + 0.99);

    double ans = 0;
    for (int i = 0; i < cells; i++)
        for (int j = 0; j < cells; j++)
            for (int k = 0; k < cells; k++) {

                double x_[2], y_[2], z_[2],
                        sizex = (q.a[0][1] - q.a[0][0]) / cells,
                        sizey = (q.a[1][1] - q.a[1][0]) / cells,
                        sizez = (q.a[2][1] - q.a[2][0]) / cells;
                x_[0] = q.a[0][0] + i * sizex;
                x_[1] = x_[0] + sizex;
                y_[0] = q.a[1][0] + j * sizey;
                y_[1] = y_[0] + sizey;
                z_[0] = q.a[2][0] + k * sizez;
                z_[1] = z_[0] + sizez;

                int hit = 0;
                for (int it = 0; it < iter; it++) {
                    double pt[3];
                    pt[0] = x_[0] + (x_[1] - x_[0]) * (rand() % M) / M;
                    pt[1] = y_[0] + (y_[1] - y_[0]) * (rand() % M) / M;
                    pt[2] = z_[0] + (z_[1] - z_[0]) * (rand() % M) / M;


                    for (int angle = 0; angle < (usePR ? (angles * angles * angles) : angles); angle++)
                        for (int ii = 0; ii < cnt_index[angle]; ii++) {
                            int i = index[angle][ii];
                            int flag = 1;
                            for (int j = 0; j < 6; j++) {
                                double a[3][3];
                                for (int k = 0; k < 3; k++)
                                    for (int p = 0; p < 3; p++)
                                        a[k][p] = points[i].a[faces[j][k]].a[p] - pt[p];
                                double v = det(a);
                                if (v < 0) {
                                    flag = 0;
                                    break;
                                }
                            }
                            if (flag) {
                                hit++;
                                break;
                            }
                        }
                }
                ans += hit * 1.0 / iter / (usePR ? (angles * angles * angles) : angles) * weights[i][j][k];
            }

    return ans / cells / cells / cells;


}

int main(int argc, char **argv) {
    printf("WebAssembly module loaded\n");
//    freopen("/Users/mazeyu/Downloads/coverage_3D/data.txt", "r", stdin);
//    for (int i = 0; i < N; i++) {
//        scanf("%lf %lf %lf %lf %lf %lf", &lng[i], &lat[i], &hgt[i], &yaw[i], &pitch[i], &roll[i]);
//    }
//    double qlat = 40.70998525740268, qlng = -74.01425000090377, qhgt = 99.34762509524988;
//    printf("%lf\n", VCM(lat, lng, hgt, yaw, pitch, roll, N, 50, 45, 0, qlat, qlng, 10 + qhgt / 2, 100, 100, qhgt));
//

}
