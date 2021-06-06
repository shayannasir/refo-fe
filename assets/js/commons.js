// GLOBAL CONSTANTS
const LOCAL = {
    url: "http://127.0.0.1:5500",
    api: "http://localhost:8090/api",
    domain: "127.0.0.1:5500"
}
const UAT = {
    url: "https://refo-fe.netlify.app",
    api: "https://refo-be.herokuapp.com/api",
    domain: "refo-fe.netlify.app"
}
const TOAST = {
    success: "success",
    error: "error",
    info: "info"
}
const USER = {
    email: "email",
    name: "name",
    isPublished: "isPublished",
    phoneNumber:  "phoneNumber",
    role: "role",
    accountEnabled: "accountEnabled",
    token: "token"
}
const DOC_STATUS = {
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    DECLINED: "Declined",
    FIRST_DRAFT: "First Draft",
    FINAL: "Final",
    DELIVERED: "Delivered"
}
const PAY_STATUS = {
    DUE: "Due",
    PARTIALLY_PAID: "Partially Paid",
    PAID: "Paid"
}

const REQUIRED_FIELD_MSG = "This field is mandatory";
const INVALID_EMAIL_MSG = "Please enter a valid EMAIL";
const INVALID_PASSWORD_MSG = "Password should contain at least one uppercase letter, one numeric digit, and one special character. Minimum length should be 8 and maximum 15";
const PASSWORD_NO_MATCH_MSG = "Password and Confirm Password don't match";
const INVALID_PHONE_MSG = "Please enter a valid Mobile Number";
const COOKIE_LIFE = "604800"; // 7 days
const OLD_NEW_PASS_SAME = "New Password cannot be same as Old Password";
const FILE_UPLOAD_SUCCESS = "File Uploaded Successfully";
const ERRORS_IN_FORM = "There are some errors in the form";
const PAGE_INVALID = "Please enter valid Page Numbers"
var AUTH_TOKEN = false;


// ENVIRONMENT SETUP
var CURRENT = "";
if (LOCAL.url.indexOf(location.hostname)> -1)
    CURRENT = LOCAL;
else if (UAT.url.indexOf(location.hostname) > -1)
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
        this.getToken = function () {
            if (AUTH_TOKEN && AUTH_TOKEN.length > 100)
                return "Bearer " + AUTH_TOKEN;
            return false;
        }
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

// GLOBAL HELPER METHODS
const showFieldError = function(field, error) {
    field.parent().addClass('has-error').append(HELPER.getErrorText(error));
    return false;
}
const showFieldSuccess = function(field, message) {
    field.parent().append(HELPER.getSuccessText(message));
}
const clearFieldMessage = function(field) {
    field.parent().removeClass('has-error').find('p').remove();
}
const showToast = function(status, message) {
    toastr[status](message)  
} 
const showAjaxError = function(data) {
    if (data.data) {
        for (const [key, value] of Object.entries(data.data))
            showToast(TOAST.error, value);
    } else {
        showToast(TOAST.error, data.message);
    }
}
const tokenInStorage = function() {
    var token = localStorage.getItem('token');
    if (!token || !token.length > 100)
        return false;
    return token;
}
const tokenInCookie = function() {
    if (document.cookie.split(';').some((item) => item.trim().startsWith('authToken='))) {
        var token = document.cookie
        .split('; ')
        .find(row => row.startsWith('authToken='))
        .split('=')[1];
        if (!token || !token.length > 100)
            return false;
        return token;
    } else
        return false;
}
const logout = function() {
    document.cookie = "authToken='';max-age=-1";
    document.cookie = "user='';max-age=-1";
    localStorage.clear();
    AUTH_TOKEN = false;
    location.href = API.getBaseURL('/login.html');
}

// GLOBAL INIT
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

AUTH_TOKEN = tokenInStorage() ? tokenInStorage() : tokenInCookie();
if (AUTH_TOKEN) {
    $.ajaxSetup({
        contentType: 'application/json',
        headers: {
            "Authorization": API.getToken()
        }
    });
} else {
    $.ajaxSetup({
        headers: {
            "Content-Type": 'application/json'
        }
    });    
}
