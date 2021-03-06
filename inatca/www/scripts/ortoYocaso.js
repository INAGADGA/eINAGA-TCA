﻿function compute(DD, MM, YY, longitud, latitud) {
    with (Math) {
        //<!--longitud y latitud del observador-->
        Lon = longitud
        Lat = latitud
        //<!--fecha juliana-->  
        GGG = 1;
        if (YY <= 1585) GGG = 0;
        JD = -1 * floor(7 * (floor((MM + 9) / 12) + YY) / 4);
        S = 1;
        if ((MM - 9) < 0) S = -1;
        A = abs(MM - 9);
        J1 = floor(YY + S * floor(A / 7));
        J1 = -1 * floor((floor(J1 / 100) + 1) * 3 / 4);
        JD = JD + floor(275 * MM / 9) + DD + (GGG * J1);
        JD = JD + 1721027 + 2 * GGG + 367 * YY - 0.5;
        J2 = JD;
        //  <!--asignacion valores Tierra-->
        RAD = 180 / PI
        ET = 0.016718;
        VP = 8.22E-5
        P = 4.93204
        M0 = 2.12344
        MN = 1.72019E-2
        T0 = 2444000.5
        S = 2415020.5
        P = P + (J2 - T0) * VP / 100
        AM = M0 + MN * (J2 - T0)
        AM = AM - 2 * PI * floor(AM / (2 * PI))
        //<!--Ec. Kepler para Tierra-->
        V = AM + 2 * ET * sin(AM) + 1.25 * ET * ET * sin(2 * AM);
        if (V < 0) {
            V = 2 * PI + V
        }
        L = P + V
        L = L - 2 * PI * floor(L / (2 * PI))
        //<!--calculo de AR y DEC-->
        Z = (J2 - 2415020.5) / 365.2422
        OB = 23.452294 - (0.46845 * Z + 0.00000059 * Z * Z) / 3600
        OB = OB / RAD
        DC = asin(sin(OB) * sin(L))
        AR = acos(cos(L) / cos(DC))
        if (L > PI) {
            AR = 2 * PI - AR
        }
        OB = OB * RAD
        L = L * RAD
        AR = AR * 12 / PI;
        //<!--conversion a h.ms de la AR-->
        H = floor(AR);
        M = floor((AR - floor(AR)) * 60)
        S = ((AR - floor(AR)) * 60 - M) * 60
        DC = DC * RAD;
        //<!--conversion a g.ms de la DEC-->
        D = abs(DC);
        if (DC > 0) {
            G1 = floor(D)
        } else {
            G1 = (-1) * floor(D)
        }
        M1 = floor((D - floor(D)) * 60)
        S1 = ((D - floor(D)) * 60 - M1) * 60
        if (DC < 0) {
            M1 = -M1;
            S1 = -S1;
        }
        //<!--calculo de la ecuación de tiempo-->
        MR = 0.04301;
        F = 13750.987;
        C = 2 * ET * F * sin(AM) + 1.25 * ET * ET * F * sin(2 * AM);
        R = -MR * F * sin(2 * (P + AM)) + MR * MR * F * sin(4 * (P + AM)) / 2;
        ET = C + R
        //<!--cálculo del arco semidiurno-->
        H0 = acos(-tan(Lat / RAD) * tan(DC / RAD))
        H0 = H0 * RAD
        //<!--variación en declinación-->
        VD = 0.9856 * sin(OB / RAD) * cos(L / RAD) / cos(DC / RAD)
        //<!--cálculo del orto-->
        VDOR = VD * (-H0 + 180) / 360
        DCOR = DC + VDOR
        HORTO = -acos(-tan(Lat / RAD) * tan(DCOR / RAD))
        VHORTO = 5 / (6 * cos(Lat / RAD) * cos(DCOR / RAD) * sin(HORTO))
        HORTO = (HORTO * RAD + VHORTO) / 15
        TUORTO = HORTO + ET / 3600 - Lon / 15 + 12
        //<!--conversion a h.m de la Hora del orto-->
        HOR = floor(TUORTO);
        MOR = floor((TUORTO - HOR) * 60 + 0.5)
        //<!--cálculo de la culminación-->
        TUC = 12 + ET / 3600 - Lon / 15
        //<!--conversion a h.m de la Hora de la culminación-->
        HC = floor(TUC);
        MC = floor((TUC - HC) * 60 + 0.5)
        //<!--calculo del ocaso-->
        VDOC = VD * (H0 + 180) / 360
        DCOC = DC + VDOC
        HOC = acos(-tan(Lat / RAD) * tan(DCOC / RAD))
        VHOC = 5 / (6 * cos(Lat / RAD) * cos(DCOC / RAD) * sin(HOC))
        HOC = (HOC * RAD + VHOC) / 15
        TUOC = HOC + ET / 3600 - Lon / 15 + 12
        //<!--conversion a h.m de la Hora del ocaso-->
        HOC = floor(TUOC);
        MOC = floor((TUOC - HOC) * 60 + 0.5)
        //<!--altura de la culminación-->
        HCUL = 90 - Lat + (DCOR + DCOC) / 2
        //<!--conversion a º ' de la altura de la culminación-->
        GCUL = floor(HCUL);
        MCUL = floor((HCUL - GCUL) * 60 + 0.5)
        //<!--acimut del orto y ocaso-->
        ACOC = acos(-sin(DCOC / RAD) / cos(Lat / RAD)) * RAD
        ACOR = 360 - acos(-sin(DCOR / RAD) / cos(Lat / RAD)) * RAD
        //<!--conversion a º ' de los acimuts-->
        GACOC = floor(ACOC);
        MACOC = floor((ACOC - GACOC) * 60 + 0.5)
        GACOR = floor(ACOR);
        MACOR = floor((ACOR - GACOR) * 60 + 0.5)
    }
    if (MOC == 60) {
        HOC += 1;
        MOC = 0;
    }
    var today = new Date(YY, MM - 1, DD, 0, 0, 0, 0); //new Date();
    //console.log(new Date());
    var dayW = today.getUTCDay(); //dia de la semana 0-6
    var hour = today.getUTCHours(); //hora 0-23
    var minutes = today.getUTCMinutes(); // minutos 0-59

    var p = this.DST(today);

    if (hour + p >= 24) {
        hour = (hour + p) % 24;
        if (dayW + 1 === 7) {
            dayW = 0;
        } else {
            dayW += 1;
        }
    } else {
        hour += p;
    }

    rtdo = [HOR + p, MOR, HOC + p, MOC];
    return rtdo;
}

function lastSunday(year,mes){
	var mesmas = mes+1;	
    var nD = new Date(year,mesmas,0).getUTCDate(); 
    var d = new Date(year,mes,2).getUTCDay(); 
    var n = new Date(year,mes,2).getUTCDate();
    var j = n;
    // calculo el día del siguiente domingo
    if (d !== 6)
	{ 
		j = (6-d+1)+n; 
	}
    //buscar el ultimo domingo
    var i = 0;
    var sun = 0;
    for(i=j; i <= nD; i=i+7){sun = i;}	
    return sun;
}

function DST(today){
    var year = today.getUTCFullYear();
	var month = today.getUTCMonth();
    var day = today.getUTCDate() +1;
    if (month >= 2 && month <= 9){
        if((month === 2 && day >= lastSunday(year,2)) || (month === 9 && day < lastSunday(year,9)) ){
            return 2;
        }else if(month > 2 && month < 9){
            return 2;
        }
    }
    return 1;
}
