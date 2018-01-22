var map, map2, tb, url, urlCat, coordx, coordy, poligonoConsulta, listadoAfeccionesCotos;
require([
    "dojo/dom",
    "dojo/dom-style",
    "dojo/_base/array",
    "dojo/_base/connect",
    "dojo/parser",
    "dojo/query",
    "dojo/on",
    "dojo/dom-construct",

    "esri/Color",
    "esri/config",
    "esri/map",
    "esri/graphic",
    "esri/units",
    "esri/InfoTemplate",
    "esri/dijit/PopupMobile",

    "esri/toolbars/draw",

    "esri/geometry/Circle",
    "esri/geometry/normalizeUtils",
    "esri/geometry/webMercatorUtils",
    "esri/tasks/GeometryService",
    "esri/tasks/BufferParameters",
    "esri/tasks/query",

    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/TextSymbol",

    "esri/dijit/Measurement",
    "esri/dijit/OverviewMap",
    "esri/dijit/BasemapGallery",
    'esri/dijit/Basemap',
    'esri/dijit/BasemapLayer',

    "esri/dijit/Scalebar",
    "esri/dijit/Search",
    "esri/dijit/HomeButton",
    "esri/dijit/Legend",
    "esri/dijit/LocateButton",

    "esri/layers/FeatureLayer",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/WMSLayer",
    "esri/layers/WMSLayerInfo"

],
    function (dom, domStyle, array, connect, parser, query, on, domConstruct, Color, esriConfig, Map, Graphic, Units, InfoTemplate, PopupMobile, Draw, Circle, normalizeUtils, webMercatorUtils, GeometryService, BufferParameters, Query, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, TextSymbol,
        Measurement, OverviewMap, BasemapGallery, Basemap, BasemapLayer, Scalebar, Search, HomeButton, Legend, LocateButton, FeatureLayer, ArcGISDynamicMapServiceLayer, WMSLayer, WMSLayerInfo) {
        parser.parse();

        var popup = new PopupMobile(null, domConstruct.create("div"));
        setFechas();
        // variables capa de busqueda del servicio a consultar  ------------------------------------------------------------------------------------------------------------------------------
        var rutaServicio = "https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Cotos_historico/MapServer";
        
        fTemplate = function locate() {

            if (graphico !== undefined) {
                var extension = graphico.geometry.getExtent();
                if (!extension) {
                    map.centerAndZoom(popup.getSelectedFeature().geometry, 15);
                } else {
                    map.setExtent(graphico.geometry.getExtent(), true);
                }
                // cerrar ventana datos
                $(".esriMobileInfoView").css("display", "none");
                $(".esriMobileNavigationBar").css("display", "none");
            }

        };
        var options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        var infoTemplate = new InfoTemplate("");
        infoTemplate.setTitle("${MATRICULA:compare}");
        infoTemplate.setContent(getTextContent);
        function getTextContent(graphic) {
            if (graphic.attributes.FHASTA) {
                txtDate2 = new Date(parseInt(graphic.attributes.FHASTA)).toLocaleDateString("es-ES", options);
            }
            else { txtDate2 = "Actualidad"; }
            var texto;
            texto = "<b>Matricula:  </b>" + graphic.attributes.LABELS + "</br>" +
                "<b>Tipo:  </b>" + graphic.attributes.DTIPO + "</br>" +
                "<b>Nombre:  </b>" + graphic.attributes.NOMBRE + "</br>" +
                "<b>Titular:  </b>" + graphic.attributes.TITULAR + "</br>" +
                "</br>" +
                "<b>Sup.Oficial:  </b>" + graphic.attributes.HSUPERF / 10000 + "  Has</br>" +
                "</br>" +
                "<b>Aprovechamiento:  </b>" + graphic.attributes.DAPROCH + "</br>" +
                "<b>Aprov. Secundario:  </b>" + graphic.attributes.DAPROCHSEC + "</br>" +
                "</br>" +
                "<b>Desde:  </b>" + new Date(parseInt(graphic.attributes.FDESDE)).toLocaleDateString("es-ES", options) + "</br>" +
                "<b>Hasta:  </b>" + txtDate2 + "</br></br>" +
                "<a href=http://aplicaciones.aragon.es/inacotos/buscar.do?ambito.ambito=" + graphic.attributes.AMBITO + "&coto=" + graphic.attributes.NUMERO + "&m=coto target=_blank>Consulta de terrenos cinegéticos</a><hr/>" +
                '<div id="divlocalizar"> ' +
                '<input type="button" value="Acercar "  id="locate"  title="Centrar Mapa" alt="Centrar Mapa" class = "localizacion" onclick="  fTemplate(); "/></div>';
            return texto;
        }

        var infoTemplateVias = new InfoTemplate("");
        infoTemplateVias.setTitle("${VIA}");
        infoTemplateVias.setContent(getTextContent2);
        function getTextContent2(graphic) {
            var desde = parseFloat(graphic.attributes.PK_MIN).toFixed(3);
            var hasta = parseFloat(graphic.attributes.PK_MAX).toFixed(3);
            if (desde < 0) { desde = 0;}
            var texto;
            texto = "<b>Vía:  </b>" + graphic.attributes.VIA + "</br>" +
                "<b>Km Desde:  </b>" + desde + "</br>" +
                "<b>Km Hasta:  </b>" + hasta + "</br>";
            return texto;
        }
       
        compare = function (value, key, data) {
            var matricula = data.MATRICULA;
            var ambito = matricula.substring(0, 2).replace("22", "HU").replace("44", "TE").replace("50", "Z");
            var numero = matricula.substring(2, matricula.length);
            return ambito + "-" + numero;
        };
        

        //  otras variables -------------------------------------------------------------------------------------------------------------------------------------------------------------------        
        var d = new Date();
        var dias = new Array('Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado');
        var fecha = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
        var urlDocumentacion = "https://idearagon.aragon.es/datosdescarga/descarga.php?file=medioambiente/inagis_docs/VisorINAGA_RTC_historico.html";
        var sls = new SimpleLineSymbol("solid", new Color("#444444"), 3);
        var sfs = new SimpleFillSymbol("solid", sls, new Color([68, 68, 68, 0.25]));
        gsvc = new GeometryService("https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer");
        esriConfig.defaults.geometryService = gsvc;
        esriConfig.defaults.io.alwaysUseProxy = false;
        // incicializar mapa -------------------------------------------------------------------------------------------------------------------------------------------------------------------
        map = new Map("map", {
            basemap: "hybrid",
            extent: new esri.geometry.Extent(-2.4, 39.6, 0.7, 43.3),
            infoWindow: popup,
            isZoomSlider: false,
            maxZoom: 19
        });
        map.addLayer(new esri.layers.GraphicsLayer({ "id": "Geodesic" }));
        map.infoWindow.resize(240, 200);

        var dynamicMSLayer = new esri.layers.ArcGISDynamicMapServiceLayer(rutaServicio, {
            id: "Cotos",
            //opacity: 0.5,
            outFields: ["*"]
        });
        dynamicMSLayer.setInfoTemplates({
            0: { infoTemplate: "" }, //new InfoTemplate("VÍAS", "${*}") },
            1: { infoTemplate: infoTemplateVias },
            2: { infoTemplate: new InfoTemplate("ZAPS", "${*}") },
            3: { infoTemplate: infoTemplate }
        });
        dynamicMSLayer.setVisibleLayers([0, 1, 2, 3]);
        dynamicMSLayer.setImageFormat("png32", true);
        var layerDefs = [];
        layerDefs[3] = dameFiltroFecha();
        dynamicMSLayer.setLayerDefinitions(layerDefs);
        // widgets -------------------------------------------------------------------------------------------------------------------------------------------------------------------
        geoLocate = new LocateButton({ map: map }, "LocateButton");
        geoLocate.startup();
        // widget scalebar
        var scalebar = new Scalebar({ map: map, attachTo: "bottom-center", scalebarUnit: "metric" });
        // widget medicion
        var measurement = new Measurement({
            map: map,
            defaultAreaUnit: Units.HECTARES,
            defaultLengthUnit: Units.KILOMETERS
        }, dom.byId("measurementDiv")
        );
        measurement.startup();
        // widget overview
        var overviewMapDijit = new OverviewMap({
            map: map,
            attachTo: "bottom-right",
            expandFactor: 3,
            height: 200,
            width: 200,
            color: " #D84E13",
            visible: false,
            opacity: .40
        });

        overviewMapDijit.startup();
        // widget basemap
        // cargamnos los mapas base

        var oceano = new BasemapLayer({ url: 'https://server.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer' });
        var oceanoEtiqueta = new BasemapLayer({ url: 'https://server.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Reference/MapServer' });
        // topo item for gallery
        var oceanoBasemap = new Basemap({
            layers: [oceano, oceanoEtiqueta],
            id: 'oceanos',
            title: 'Océanos',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/f9498c1f95714efabb626125cb2bb04a/info/thumbnail/tempoceans.jpg'
        });
        // terreno etiquetas

        var terreno = new BasemapLayer({ url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer' });
        var terrenoEtiqueta = new BasemapLayer({ url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer' });
        // topo item for gallery
        var terrenoBasemap = new Basemap({
            layers: [terreno, terrenoEtiqueta],
            id: 'terreno',
            title: 'Terreno Etiquetas',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/532c8cc75f414ddebc5d665ba00015ca/info/thumbnail/terrain_labels.jpg'
        });

        //topo map
        var topoLayer = new BasemapLayer({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer' });
        // topo item for gallery
        var topoBasemap = new Basemap({
            layers: [topoLayer],
            id: 'topo',
            title: 'Topográfico',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/6e03e8c26aad4b9c92a87c1063ddb0e3/info/thumbnail/topo_map_2.jpg'
        });

        //dark grey
        var dkGreyLayer = new BasemapLayer({ url: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer' });
        var dkGreyLabelsLayer = new BasemapLayer({ url: 'https://services.arcgisonline.com/arcgis/rest/services/Reference/World_Transportation/MapServer' });
        var dkGreyBasemap = new Basemap({
            layers: [dkGreyLayer, dkGreyLabelsLayer],
            id: 'dkGrey',
            title: 'Lona Gris Oscuro',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/a284a9b99b3446a3910d4144a50990f6/info/thumbnail/ago_downloaded.jpg'
        });

        //light grey
        var ltGreyLayer = new BasemapLayer({ url: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer' });
        var ltGreyLabelsLayer = new BasemapLayer({ url: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Reference/MapServer' });
        var ltGreyBasemap = new Basemap({
            layers: [ltGreyLayer, ltGreyLabelsLayer],
            id: 'ltGrey',
            title: 'Lona Gris Claro',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/8b3d38c0819547faa83f7b7aca80bd76/info/thumbnail/light_canvas.jpg'
        });
        // imagenes
        var imagenes = new BasemapLayer({ url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer' });
        var etiquetas = new BasemapLayer({ url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer' });
        var imagenBasemap = new Basemap({
            layers: [imagenes, etiquetas],
            id: 'images',
            title: 'Imágenes con etiquetas',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/3027a41ed46d4a9b915590d14fecafc0/info/thumbnail/imagery_labels.jpg'
        });
        // clarity
        var clarity = new BasemapLayer({ url: 'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer' });
        var clarityBasemap = new Basemap({
            layers: [clarity, etiquetas],
            id: 'clarity',
            title: 'clarity world',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/da10cf4ba254469caf8016cd66369157/info/thumbnail/imagery_clarity_sm.jpg'
        });

        // NACIONAL GEOGRAPIC

        var natGeo = new BasemapLayer({ url: 'https://server.arcgisonline.com/arcgis/rest/services/NatGeo_World_Map/MapServer' });
        var natGeoBasemap = new Basemap({
            layers: [natGeo],
            id: 'natgeo',
            title: 'Nacional Geographic',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/7ec6f7c55cf6478596435f2d501834fa/info/thumbnail/natgeo.jpg'
        });

        // open street map


        var street1 = new BasemapLayer({
            type: "WebTiledLayer", url: "https://tile.openstreetmap.org/${level}/${col}/${row}.png"
        });

        var streetBasemap = new Basemap({
            layers: [street1],
            id: 'street',
            title: 'Open Street Map',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/d415dff75dd042258ceda46f7252ad70/info/thumbnail/temposm.jpg'
        });

        // widget basemap
        var basemapGallery = new BasemapGallery({
            showArcGISBasemaps: false,
            map: map,
            basemaps: [topoBasemap, dkGreyBasemap, ltGreyBasemap, imagenBasemap, clarityBasemap, natGeoBasemap, streetBasemap, terrenoBasemap, oceanoBasemap]
        }, 'basemapGallery');


        basemapGallery.startup();
        basemapGallery.on("error", function (msg) {
            //console.log("basemap gallery error:  ", msg);
        });
        // widget home
        var home = new HomeButton({
            map: map
        }, "HomeButton");
        home.startup();

        // Capas necesarias -------------------------------------------------------------------------------------------------------------------------------------------------------------------
        var fcCotos = new FeatureLayer("http://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Cotos_historico/MapServer/3");
        var fcMunis = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Ambitos/MapServer/3");
        var fcPks = new FeatureLayer("http://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_siniestrosT34/MapServer/3")
        var dynamicMSLayerBasico = new esri.layers.ArcGISDynamicMapServiceLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Ambitos/MapServer", {

            id: "xLimites",
            outFields: ["*"]
        });
        dynamicMSLayerBasico.setVisibleLayers([1, 2, 3]);

        
        //Eventos -------------------------------------------------------------------------------------------------------------------------------------------------------------------
        $(document).on('change', '#slider-100', function () {
            console.log($("#slider-100").val());
            dynamicMSLayer.setOpacity($("#slider-100").val() / 100);
        });

        $(document).on('change', '#fechaini', function () {            
            var layerDefs = [];
            layerDefs[3] = dameFiltroFecha(); 
            dynamicMSLayer.setLayerDefinitions(layerDefs);
        });
        
        //click handler for the draw tool buttons
        query(".tool").on("click", function (evt) {
            if (tb) {
                tb.activate(evt.target.id);
                map.setInfoWindowOnClick(false);
                $("[data-role=panel]").panel("close");
            }
        });
        popup.on("selection-change", function () {
            graphico = popup.getSelectedFeature();
        });
        on(dom.byId("clearGraphicsM"), "click", function () {
            if (map) {
                measurement.clearResult();
                measurement.setTool("area", false);
                measurement.setTool("distance", false);
                measurement.setTool("location", false);
                map.setInfoWindowOnClick(true);
            }
        });
        map.on("load", initToolbar);	
        map.on("update-end", function () { map.setMapCursor("default"); });
        map.on("update-start", function () { map.setMapCursor("wait"); });
        //add the legend
        map.on("layers-add-result", function (evt) {
            var layerInfo = array.map(evt.layers, function (layer, index) {
                return { layer: layer.layer, title: layer.layer.name };
            });
            if (layerInfo.length > 0) {
                var legendDijit = new Legend({
                    map: map,
                    layerInfos: layerInfo
                }, "legendDiv");
                legendDijit.startup();
            }
        });

        map.on("update-end", function () {           
            map.setMapCursor("default");
            domStyle.set(dom.byId("procesando"), "display", "none");

        });
        map.on("update-start", function () {
            map.setMapCursor("wait");
            domStyle.set(dom.byId("procesando"), "display", "inline-block");
            $("#popupNested").popup("close");
        });
   
        measurement.on("measure-end", function (evt) {
            if (evt.toolName === "location") {
                projectToEtrs89(evt.geometry);
            }
            $("[data-role=panel]").panel("open");
        });
        measurement.on("tool-change", function (evt) {
            map.setInfoWindowOnClick(false); dom.byId("etrs").innerHTML = "";
            $("[data-role=panel]").panel("close");
        });
        on(dom.byId("posicion"), "click", function () {
            getPosition();
        });
             
        
        //localizaPk
        var fcsymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 12, new SimpleLineSymbol(SimpleLineSymbol.STYLE_NULL, new Color([247, 34, 101, 0.9]), 1), new Color([207, 34, 171, 0.5]));
        fcPks.setSelectionSymbol(fcsymbol);
        on(dom.byId("localizaPk"), "click", function () {            
            var query = new Query();
            query.where = "VIA = '" + dom.byId("VIA").value + "' AND PK = " + dom.byId("PK").value;
            query.returnGeometry = true;
            query.outFields = ["*"];
            fcPks.queryFeatures(query, bufferPks);
        });

        on(dom.byId("posicion"), "click", function () {
            getPosition();
        });
        on(dom.byId("posicionHerr"), "click", function () {
            getCotosPosition1km();
        });
        on(dom.byId("busquedaCotos"), "click", function () {
            map.getLayer("Geodesic").clear();
            var query = new Query();
            var dropd = $("#select-choice-1");
            query.where = "AMBITO = " + dropd.find('option:selected').val() + " AND NUMERO = " + dom.byId("numero").value + " and " + dameFiltroFecha();
            query.returnGeometry = true;
            query.outFields = ["*"];
            fcCotos.queryFeatures(query, pintaSeleccionCotos);
            $("[data-role=panel]").panel("close");

        });

        // funciones   -------------------------------------------------------------------------------------------------------------------------------------------------------------------
        function dameFiltroFecha() {
            var midatestring = $("#fechaini").val(); //.split('/');
            return "((FDESDE <= date '" + parseDate(midatestring) + "' AND FHASTA > date '" + parseDate(midatestring) + "') OR (FDESDE <= date '" + parseDate(midatestring) + "' AND FHASTA IS NULL))";
        }
        function pintaSeleccionCotos(response) {
            var feature;
            map.graphics.clear();
            var features = response.features;
            if (features.length == 0) {
                dom.byId("busqueda").innerHTML = "No se ha encontrado ningún coto con esa matricula";
            }
            for (var x = 0; x < features.length; x++) {
                dom.byId("busqueda").innerHTML = "";
                pintaGeomEnprojectToWebMercator(features[x].geometry);
            }
        }

        function getPosition() {
            var options = {
                enableHighAccuracy: true,
                maximumAge: 3600000
            }
            var watchID = navigator.geolocation.getCurrentPosition(onSuccess, onError, options);

            function onSuccess(position) {
               
                var miposicion = new esri.geometry.Point;
                miposicion.x = position.coords.longitude;
                miposicion.y = position.coords.latitude;
                projectToEtrs89(miposicion);
                map.centerAndZoom(miposicion, 17);
                var markerSymbol = new SimpleMarkerSymbol();                
                markerSymbol.setPath("M40.94,5.617C37.318,1.995,32.502,0,27.38,0c-5.123,0-9.938,1.995-13.56,5.617c-6.703,6.702-7.536,19.312-1.804,26.952  L27.38,54.757L42.721,32.6C48.476,24.929,47.643,12.319,40.94,5.617z M27.557,26c-3.859,0-7-3.141-7-7s3.141-7,7-7s7,3.141,7,7  S31.416,26,27.557,26z");
                markerSymbol.setColor(new Color([19, 24, 175, 0.80]));
                markerSymbol.setSize(40);
                map.graphics.clear();
                map.graphics.add(new Graphic(miposicion, markerSymbol));
            };

            function onError(error) {
                alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
            }
        }
        function getCotosPosition1km() {
            var options = {
                enableHighAccuracy: true,
                maximumAge: 3600000
            }
            var watchID = navigator.geolocation.getCurrentPosition(onSuccess, onError, options);

            function onSuccess(position) {
                //alert('Latitude: ' + position.coords.latitude + '\n' +
                //    'Longitude: ' + position.coords.longitude + '\n' +
                //    'Altitude: ' + position.coords.altitude + '\n' +
                //    'Accuracy: ' + position.coords.accuracy + '\n' +
                //    'Altitude Accuracy: ' + position.coords.altitudeAccuracy + '\n' +
                //    'Heading: ' + position.coords.heading + '\n' +
                //    'Speed: ' + position.coords.speed + '\n' +
                //    'Timestamp: ' + position.timestamp + '\n');

                var miposicion = new esri.geometry.Point;
                miposicion.x = position.coords.longitude;
                miposicion.y = position.coords.latitude;
                projectToEtrs89(miposicion);
                map.centerAndZoom(miposicion, 17);
                var markerSymbol = new SimpleMarkerSymbol();
                markerSymbol.setPath("M40.94,5.617C37.318,1.995,32.502,0,27.38,0c-5.123,0-9.938,1.995-13.56,5.617c-6.703,6.702-7.536,19.312-1.804,26.952  L27.38,54.757L42.721,32.6C48.476,24.929,47.643,12.319,40.94,5.617z M27.557,26c-3.859,0-7-3.141-7-7s3.141-7,7-7s7,3.141,7,7  S31.416,26,27.557,26z");
                markerSymbol.setColor(new Color([19, 24, 175, 0.80]));
                markerSymbol.setSize(40);
                map.graphics.clear();
                map.graphics.add(new Graphic(miposicion, markerSymbol));                
                doBuffer(miposicion, '1', GeometryService['UNIT_KILOMETER']);
            };

            function onError(error) {
                alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
            }
        }

       
        function stringToDate(_date, _format, _delimiter) {

            var formatLowerCase = _format.toLowerCase();
            var formatItems = formatLowerCase.split(_delimiter);
            var dateItems = _date.split(_delimiter);
            var monthIndex = formatItems.indexOf("mm");
            var dayIndex = formatItems.indexOf("dd");
            var yearIndex = formatItems.indexOf("yyyy");
            var month = parseInt(dateItems[monthIndex]);
            month -= 1;
            var formatedDate = new Date(dateItems[yearIndex], month, dateItems[dayIndex]);
            return formatedDate;
        }

        function setFechas() {
            var d = new Date();
            var dia = d.getDate();
            var mes = d.getMonth() + 1;
            var diaIni = dia;

            if (mes === 2) { // bisiesto
                var bisiesto = (anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0));
                if (dia > 29 || (dia === 29 && !bisiesto)) {

                    diaIni = 28;
                }
            }
            var diaString = dia.toString();
            var mesString = mes.toString();
            var diaIniString = diaIni.toString();

            if (diaString.length < 2) { diaString = '0' + diaString; }
            if (diaIniString.length < 2) { diaIniString = '0' + diaIniString; }
            if (mesString.length < 2) { mesString = '0' + mesString; }

            var fechaHoy = diaString + "/" + mesString + "/" + d.getFullYear();

            dom.byId("fechaini").value = fechaHoy;
            var fechaHoySplit = fechaHoy.split("/");

            var midatestringIni = $("#fechaini").val();
            if (midatestringIni === undefined || midatestringIni === "") {
                dom.byId("fechaini").value = [fechaHoySplit[2], fechaHoySplit[1], fechaHoySplit[0]].join("-");
            }
        }

        function parseDate(fecha) {
            var inter;
            var fechaFinal;
            var indice = fecha.indexOf("/");
            //alert(indice);
            if (indice !== -1) {
                inter = fecha.split("/");
                fechaFinal = inter[0] + "/" + inter[1] + "/" + inter[2];
            } else {
                inter = fecha.split("-");
                fechaFinal = inter[2] + "/" + inter[1] + "/" + inter[0];
            }
            return fechaFinal;
        }

        function validaFecha(fecha) {
            var fecha1 = parseDate(fecha);
            var datePat = /^(\d{1,2})(\/|-)(\d{1,2})(\/|-)(\d{4})$/;
            var fechaCompleta = fecha1.match(datePat);
            if (fechaCompleta === null) {
                return false;
            }

            dia = fechaCompleta[1];
            mes = fechaCompleta[3];
            anio = fechaCompleta[5];

            if (dia < 1 || dia > 31) {

                return false;
            }
            if (mes < 1 || mes > 12) {

                return false;
            }
            if ((mes === 4 || mes === 6 || mes === 9 || mes === 11) && dia === 31) {

                return false;
            }
            if (mes === 2) { // bisiesto
                var bisiesto = (anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0));
                if (dia > 29 || (dia === 29 && !bisiesto)) {

                    return false;
                }
            }
            return true;

        }

        function zoomExtension(minx, miny, maxx, maxy) {
            var _extent = new esri.geometry.Extent(minx, miny, maxx, maxy, new esri.SpatialReference({ wkid: 25830 }));
            var outSR = new esri.SpatialReference(3857);
            var params = new esri.tasks.ProjectParameters();
            params.geometries = [_extent];
            params.outSR = outSR;
            gsvc.project(params, function (projectedPoints) {
                pt = projectedPoints[0];
                map.setExtent(projectedPoints[0], true);
            });
        }

        function projectToEtrs89(geometry) {
            var outSR = new esri.SpatialReference(25830);
            var params = new esri.tasks.ProjectParameters();
            params.geometries = [geometry]; //[pt.normalize()];
            params.outSR = outSR;
            var pt;
            gsvc.project(params, function (projectedPoints) {
                pt = projectedPoints[0];
                coordx = pt.x.toFixed(0);
                coordy = pt.y.toFixed(0);
                dom.byId("etrs").innerHTML = "<hr /><b>Coordenada en ETRS89 30N</br><table style='width:100%'><tr><th>X</th><th>Y</th></tr><tr><td>" + pt.x.toFixed(0) + "</td><td>" + pt.y.toFixed(0) + "</td></tr></table><hr />";
            });
        }
        function pintaGeomEnprojectToWebMercator(geometry) {
            var outSR = new esri.SpatialReference(map.spatialReference.wkid);
            var params = new esri.tasks.ProjectParameters();
            params.geometries = [geometry]; //[pt.normalize()];
            params.outSR = outSR;
            var geom;
            gsvc.project(params, function (projectedGeom) {
                geom = projectedGeom[0];
                var sfs = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
                        new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25])
                );
                var graphic = new Graphic(geom, sfs);
                map.graphics.add(graphic);
                map.setExtent(geom.getExtent(), true);
            });
        }
       
        function OpenInNewTab(url) {
            var win = window.open(url);
            win.focus();
        }

        function bufferPks(response) {
            var feature;
            map.graphics.clear();
            var features = response.features;
            if (features.length == 0) {
                dom.byId("seleccion").innerHTML = "Ningún punto encontrado";
            }
            else {
                dom.byId("seleccion").innerHTML = "";
                doBuffer(features[0], 1, esri.tasks.GeometryService.UNIT_KILOMETER);
            }
        }

        function initToolbar(evtObj) {
            tb = new Draw(evtObj.map);
            tb.on("draw-end", doAreaInfluencia);
        }
        function doAreaInfluencia(evtObj) {            
            doBuffer(evtObj, '1', GeometryService['UNIT_KILOMETER']); //dom.byId("unit").value]);
        }
        function doBuffer(evtObj, distancia, unidades) {
            map.getLayer("Geodesic").clear();
            map.graphics.clear();
            map.setInfoWindowOnClick(true);
            tb.deactivate();
            var geometry = evtObj.geometry, symbol;
            if (evtObj.geometry === undefined) {
                geometry = evtObj;
            }
            switch (geometry.type) {
                case "point":
                    symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 10, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([7, 41, 101]), 2), new Color([20, 255, 255, 0.25]));
                    break;
                case "polyline":
                    symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([255, 0, 0]), 1);
                    break;
                case "polygon":
                    symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NONE, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25]));
                    break;
            }
            var graphic = new Graphic(geometry, symbol);
            map.graphics.add(graphic);
            //setup the buffer parameters
            var params = new BufferParameters();
            params.distances = [distancia];
            params.outSpatialReference = map.spatialReference;
            params.unit = [unidades];
            params.geodesic = true;
            // normaliza la geometria				
            normalizeUtils.normalizeCentralMeridian([geometry]).then(function (normalizedGeometries) {
                var normalizedGeometry = normalizedGeometries[0];
                if (normalizedGeometry.type === "polygon") {
                    esriConfig.defaults.geometryService.simplify([normalizedGeometry], function (geometries) {
                        params.geometries = geometries;
                        esriConfig.defaults.geometryService.buffer(params, showGeodesic);
                    });
                } else {
                    params.geometries = [normalizedGeometry];
                    esriConfig.defaults.geometryService.buffer(params, showGeodesic);
                }
            });
        }
        function showGeodesic(b) {
            var attrs, sym;
            attrs = { "type": "Geodesic" };
            sym = new esri.symbol.SimpleFillSymbol();
            sym.setColor(new Color([20, 255, 255, 0.25]));
            sym.setOutline(new esri.symbol.SimpleLineSymbol("solid", new Color([7, 41, 101]), 3)); //rgba(7, 41, 101, 0.85);
            addGraphic(b[0], attrs, sym);
        }
        function addGraphic(geom, attrs, sym) {
            var template, g, s;
            poligonoConsulta = geom;
          //  template = new esri.InfoTemplate("", "Type: ${type}");
            g = map.getLayer("Geodesic");
            map.getLayer(attrs.type).add(
                new esri.Graphic(geom, sym, attrs, template)
            );
            if (g.graphics.length > 0) {
                map.setExtent(esri.graphicsExtent([g.graphics[0]]).expand(2), true);
            }
            var query = new Query();
            query.geometry = geom.getExtent();
            query.outFields = ["*"];
            query.where = dameFiltroFecha();
            fcCotos.queryFeatures(query, dameCotos);
        }
        function dameCotos(response) {
            var feature;
            var features = response.features;
            listadoAfeccionesCotos = "<b>Cotos Afectados:</b>";
            if (features.length == 0) { dom.byId("seleccion").innerHTML = "Ningún punto encontrado"; } else { dom.byId("seleccion").innerHTML = ""; }
            for (var x = 0; x < features.length; x++) {
                var contains = features[x].geometry.contains(poligonoConsulta.getExtent().getCenter());
                var polygon = new esri.geometry.Polygon(map.spatialreference);
                polygon = features[x].geometry;
                polygon.addRing(poligonoConsulta.rings[0]);
                var isIntersecting = polygon.isSelfIntersecting(polygon);
                if (isIntersecting || contains) {
                    listadoAfeccionesCotos += "</br>" + features[x].attributes.LABELS;
                }
            }           
            $("#colapseCotos").collapsible("expand");
            $("[data-role=panel]").panel("open");            
            var query = new Query();
            query.geometry = poligonoConsulta.getExtent();
            query.outFields = ["*"];
            fcMunis.queryFeatures(query, dameMunicipios);
        }
        
        function dameMunicipios(response) {
            var feature;
            var features = response.features;
            var popTotal = "<b>Municipios Afectados:</b>";
            for (var x = 0; x < features.length; x++) {
                var contains = features[x].geometry.contains(poligonoConsulta.getExtent().getCenter());
                var polygon = new esri.geometry.Polygon(map.spatialreference);
                polygon = features[x].geometry;
                polygon.addRing(poligonoConsulta.rings[0]);
                var isIntersecting = polygon.isSelfIntersecting(polygon);
                if (isIntersecting || contains) {
                    popTotal += "</br>" + features[x].attributes.D_MUNI_INE;
                }
            }
            var midatestring = parseDate($("#fechaini").val()).split('/'); 
            coordx = (map.extent.xmax - map.extent.xmin) / 2 + map.extent.xmin;
            coordy = (map.extent.ymax - map.extent.ymin) / 2 + map.extent.ymin;
            var number = webMercatorUtils.xyToLngLat(coordx, coordy);
            coordx = number[0];
            coordy = number[1];
            var month = parseInt(midatestring[1]);
            var day = parseInt(midatestring[0]);
            var year = parseInt(midatestring[2]);
            var rtdo = compute(day, month, year, coordx, coordy);
            var d = new Date(year, month - 1, day);
            var mifecha = dias[d.getDay()] + "  " + d.toLocaleDateString("es-ES", options); 
            var consultaOrto = "<b>Fecha: </b>" + mifecha + "<hr>" + listadoAfeccionesCotos + "<hr>" + popTotal + " <hr><b>Orto: </b>" + rtdo[0] + " h " + rtdo[1] + " min </br><b>Ocaso: </b> " + rtdo[2] + " h " + rtdo[3] + " min";
            dom.byId("ortoyocaso").innerHTML = consultaOrto;
            $("#colapseCotos").collapsible("expand");
            $("[data-role=panel]").panel("open");
        }


        // busquedas -------------------------------------------------------------------------------------------------------------------------------------------------------------------
        var customExtentAndSR = new esri.geometry.Extent(-300000, 4840000, 120000, 5280000, new esri.SpatialReference({ wkid: 3857 }));

        var layer1 = new WMSLayerInfo({
            name: 'Catastro',
            title: 'Catastro',
            queryable: true,
            showPopup: true,
            featureInfoFormat: "jsonp"
        });

        var resourceInfo = {
            extent: customExtentAndSR,
            layerInfos: [layer1]
        };
        var layerCat = new WMSLayer('https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?', {
            resourceInfo: resourceInfo,
            visibleLayers: ['Catastro']

        });
        layerCat.id = "OVC";
        layerCat.version = "1.1.1";
        layerCat.spatialReferences[0] = 3857;
        layerCat.visible = false;
        var templateCatastro = "<p>Referencia:${REFPAR}</p><p>Municipio:${CODMUN}</p><p>Agregado:${MUNAGR}</p><p>Polígono:${MASA}</p><p>Parcela:${PARCELA}</p>";
        var templateMunicipios = "<p>Código:${C_MUNI_INE}</p><p>Municipio:${D_MUNI_INE}</p><p>Provincia:${PROVINCIA}</p><p>Comarca:${D_COMARCA}</p>";
        var s = new Search({
            enableButtonMode: true,
            enableLabel: false,
            enableInfoWindow: true,
            showInfoWindowOnSelect: true,
            enableSuggestions: true,
            enableSuggestionsMenu: true,
            map: map
        }, "search");
        var sources = [
            {
            //    featureLayer: fcInf,
            //    searchFields: searchFields, //["SOLICITANTE","NUMEXP"],
            //    displayField: displayField, //"SOLICITANTE",
            //    exactMatch: false,
            //    name: name, //"Resolución  (Solicitante,Expediente)",
            //    outFields: ["*"],
            //    placeholder: " ",
            //    maxResults: 6,
            //    maxSuggestions: 6,
            //    enableSuggestions: true,
            //    infoTemplate: infoTemplate,
            //    minCharacters: 0
            //}, {
                featureLayer: fcMunis,
                searchFields: ["D_MUNI_INE"],
                displayField: "D_MUNI_INE",
                exactMatch: false,
                name: "Municipios",
                outFields: ["*"],
                placeholder: "Introduzca nombre de Municipio",
                maxResults: 6,
                maxSuggestions: 6,
                enableSuggestions: true,
                infoTemplate: new InfoTemplate("${D_MUNI_INE}", templateMunicipios),
                minCharacters: 0
            }, {
                featureLayer: new esri.layers.FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Ambitos/MapServer/5"),
                searchFields: ["REFPAR"],
                displayField: "REFPAR",
                exactMatch: true,
                name: "Parcelas Catastrales",
                outFields: ["*"],
                placeholder: "Introduza Refpar completa",
                maxResults: 6,
                maxSuggestions: 6,
                enableSuggestions: true,
                infoTemplate: new InfoTemplate("${REFPAR}", templateCatastro),
                minCharacters: 0
            },
            //{
            //    featureLayer: new esri.layers.FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Ambitos/MapServer/7"),
            //    searchFields: ["REFPAR"],
            //    displayField: "REFPAR",
            //    exactMatch: true,
            //    name: "Parcelas Sigpac",
            //    outFields: ["*"],
            //    placeholder: " ",
            //    maxResults: 6,
            //    maxSuggestions: 6,
            //    enableSuggestions: true,
            //    infoTemplate: new InfoTemplate("${REFPAR}", templateSigpac),
            //    minCharacters: 0
            //},
            {
                locator: new esri.tasks.Locator("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"),
                singleLineFieldName: "SingleLine",
                name: "Geocoding Service",
                localSearchOptions: {
                    minScale: 300000,
                    distance: 50000
                },
                placeholder: "Búsqueda por Geocoder",
                maxResults: 3,
                maxSuggestions: 6,
                enableSuggestions: false,
                minCharacters: 0
            }];
        s.set("sources", sources);
        s.startup();

        // cambiar la visibilidad de las búsquedas
        on(s, 'search-results', function (e) {

            if (e.errors === null) {

                if (e.activeSourceIndex === 1) {
                    //wmsSigpac.visible = false;
                    layerCat.visible = true;
                } else if (e.activeSourceIndex === 2) {
                    //wmsSigpac.visible = true;
                    layerCat.visible = false;
                } else {
                    //wmsSigpac.visible = false;

                }
                map.setExtent(map.extent);
            }

        });
        on(s, 'clear-search', function (e) {
            dynamicMSLayerBasico.setVisibleLayers([0, 1, 2, 3]);
            //wmsSigpac.visible = false;
            layerCat.visible = false;
        });
        // carga capas -y eventos ------------------------------------------------------------------------------------------------------------------------------------------------------------------

        // inicializar las fechas para realizar la búsqueda del último año       
        map.addLayers([dynamicMSLayerBasico, dynamicMSLayer, layerCat]);

        $("#radio-0").click(function () {
            $("#radio-1").prop("checked", false);
            $("#radio-1").checkboxradio("refresh");
            $("#radio-2").prop("checked", false);
            $("#radio-2").checkboxradio("refresh");
            $(this).prop("checked", true);
            $(this).checkboxradio("refresh");
            layerCat.visible = true;
            //wmsSigpac.visible = false;
            map.setExtent(map.extent);
        });
        $("#radio-2").click(function () {
            $("#radio-0").prop("checked", false);
            $("#radio-0").checkboxradio("refresh");
            $("#radio-1").prop("checked", false);
            $("#radio-1").checkboxradio("refresh");
            $(this).prop("checked", true);
            $(this).checkboxradio("refresh");
            layerCat.visible = false;
            map.setExtent(map.extent);
        });

    });
