// GLOBAL CONSTANTS
const LOCAL = {
    url: "http://127.0.0.1:5500",
    api: "http://localhost:8090/api",
}
const UAT = {
    url: "https://refo-fe.netlify.app",
    api: "https://refo-be.herokuapp.com/api",
}
const TOAST = {
    success: "success",
    error: "error",
    info: "info"
}

const REQUIRED_FIELD_MSG = "This field is mandatory";
const INVALID_EMAIL_MSG = "Please enter a valid EMAIL";
const INVALID_PASSWORD_MSG = "Password should contain at least one uppercase letter, one numeric digit, and one special character. Minimum length should be 8 and maximum 15";
const PASSWORD_NO_MATCH_MSG = "Password and Confirm Password don't match";
const INVALID_PHONE_MSG = "Please enter a valid Mobile Number";


// ENVIRONMENT SETUP
var CURRENT = "";
if (LOCAL.url.indexOf(location.hostname))
    CURRENT = LOCAL;
else if (UAT.url.indexOf(location.hostname))
    CURRENT = UAT;


// HELPER CLASSES
class API_INIT {
    constructor() {
        var endpoint = CURRENT.api;
        var baseURL = CURRENT.url;

        this.getAPIEndPoint = function (relativeURL) {
            return encodeURI(endpoint + relativeURL);
        };

        this.getBaseURL = function (relativeURL) {
            return encodeURI(baseURL + relativeURL);
        };
    }
}
const API = new API_INIT();

class SITE_INIT {
    constructor() {
        this.getErrorText = function(message) {
            return "<p class='error'>" + message + "</p>";
        }
        this.getSuccessText = function(message) {
            return "<p class='success'>" + message + "</p>";
        }
    }
}
const HELPER = new SITE_INIT();

class REGEX_INIT {
    constructor() {
        this.isValidEmail = function(email) {
            var reg = new RegExp(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)$/);
            return reg.test(email);
        }
        this.isValidPassword = function(pass) {
            var reg = new RegExp(/((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,15})/);
            return reg.test(pass);
        }
        this.isValidPhone = function(phone) {
            var reg = new RegExp(/(0|^\+91|^\+91-)?[6-9]{1}[0-9]{9}/);
            return reg.test(phone);
        }
    }
}
const VALIDATOR = new REGEX_INIT();

// GLOBAL EVENT LISTENERS
$('input[type=number]').on('keydown', function(e) {
    if (e.which === 38 || e.which === 40)
        e.preventDefault();
})

toastr.options = {
    "closeButton": true,
    "debug": false,
    "newestOnTop": false,
    "progressBar": true,
    "positionClass": "toast-top-right",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "9000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
  }