// Si quiere una introducción sobre la plantilla En blanco, vea la siguiente documentación:
// http://go.microsoft.com/fwlink/?LinkID=397704
// Para depurar código al cargar la página en cordova-simulate o en dispositivos o emuladores Android: inicie la aplicación, establezca puntos de interrupción 
// y ejecute "window.location.reload()" en la Consola de JavaScript.

function redireccionar() {    
    window.open('cotos.html', '_blank', 'location=yes');
}   

(function () {
    "use strict";

    document.addEventListener('deviceready', onDeviceReady.bind(this), false);
    

    function onDeviceReady() {
        // Controlar la pausa de Cordova y reanudar eventos
        document.addEventListener('pause', onPause.bind(this), false);
        document.addEventListener('resume', onResume.bind(this), false);
        if (navigator.userAgent.match(/Android/i)) {
            document.addEventListener('backbutton', onBackKeyDown, false);
        }
        
        // TODO: Cordova se ha cargado. Haga aquí las inicializaciones que necesiten Cordova.
        var parentElement = document.getElementById('deviceready');        
        var enlaces = document.getElementById('contenedor');
        enlaces.setAttribute('style', 'display:block;');

        //setTimeout("redireccionar()", 2000); //tiempo expresado en milisegundos
    }

    function onPause() {
        // TODO: esta aplicación se ha suspendido. Guarde el estado de la aplicación aquí.
    }

    function onResume() {
        // TODO: esta aplicación se ha reactivado. Restaure el estado de la aplicación aquí.
    }
    
    function onBackKeyDown(e) {
        e.preventDefault();
        navigator.app.exitApp();
    }

})();