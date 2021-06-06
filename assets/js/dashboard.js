var documentListObj = {
    sortColumn: "id",
    sortOrder: "desc",
    pageSize: 15,
    pageIndex: 0,
    fetchAllRecords: false,
    searchText: "",
    priority: null
}

var documentRegisterObj = {
    file:"",
    documentName:"",
    serviceType:"",
    otherServiceType:"",
    uploadedPages:"",
    priority:"",
    additionalInformation: null
}

$(document).ready(function() {
    if (!AUTH_TOKEN)
        location.href = API.getBaseURL('/login.html');
    getDocumentList();
})

$('a.cta-logout').on('click', function() {
    logout();
})

$('a.filter').on('click', function() {
    var filter = $(this).attr('data-filter');
    getDocumentList(filter);
})

$(document).on('click', '#uploadDoc .type', function() {
    var type = $(this).attr('data-priority');
    documentRegisterObj.priority = type;
    $(this).closest('.modal').modal('hide');
    $('#submitDoc').modal('show');
})

$('#submitDoc').on('show.bs.modal', function() {
    var date = new Date().toLocaleDateString().replaceAll("/", "-");
    $(this).find('input[name=date]').val(date);
})

$(document).on('change', 'input[type=file][name=file]', function() {
    var files = $(this).get(0).files[0]
    var formData = new FormData();
    formData.append('file', files);
    if (files) {
        $.ajax({
            type: "POST",
            url: API.getAPIEndPoint('/file/upload'),
            data: formData,
            processData: false,
            contentType: false,
            success: function(data) {
                if (data.status === true && data.data) {
                    documentRegisterObj.file = data.data.name
                    showToast(TOAST.success, FILE_UPLOAD_SUCCESS);
                } else if (data.status === false) {
                    showAjaxError(data);
                }
            }
        })
    }
})

$('#submitDoc span.remove-file').on('click', function() {
    $(this).parent().find('input[name=file][type=file]').val('');
    documentRegisterObj.file = '';
})

$('#submitDoc .cta-submit').on('click', function() {
    if (!validateFields()) {
        return showToast(TOAST.error, ERRORS_IN_FORM);
    } else {
        $.ajax({ 
            type: "POST",
            url: API.getAPIEndPoint('/document/submit'),
            data: JSON.stringify(documentRegisterObj),
            success: function(data) {
                if (data.status === true) {
                    showToast(TOAST.success, data.message);
                    setTimeout(() => {
                        location.href = API.getBaseURL('/dashboard.html');
                    }, 2000)
                } else if (data.status === false) {
                    showAjaxError(data);
                }
            }
        })
    }
})

$('#submitDoc select[name=serviceType]').on('change', function() {
    var selected = $(this).val();
    if (selected && selected === "OTHER") {
        $(this).closest('form').find('textarea[name=otherServiceType]').closest('.form-group').removeClass('display-n');
    } else {
        $(this).closest('form').find('textarea[name=otherServiceType]').closest('.form-group').addClass('display-n');
    }
})

const getDocumentList = function(filter) {

    documentListObj.priority = filter;

    $.ajax({
        type: "POST",
        url: API.getAPIEndPoint('/document/list'),
        data: JSON.stringify(documentListObj),
        success: function(data) {
            if (data.status === true || data.status === false) {
                $('.dashboard-table tbody').html('');
                $('.count').html("Total Count: " + data.recordsFiltered);
                if (data.data) {
                    var $body = $('.dashboard-table tbody');
                    var documents = data.data;
                    documents.forEach(element => {
                        var paymentStatus = PAY_STATUS[element.paymentStatus];
                        var status = DOC_STATUS[element.status];
                        var documentName = truncateString(element.documentName, 20);
    
                        var uploadDate = new Date(element.uploadDate);
                        uploadDate = uploadDate.toLocaleDateString().replaceAll("/", "-");
    
                        $body.append(` <tr> <th scope="row">${element.documentID}</th> <td class="truncate" title="${element.documentName}">${documentName}</td> <td>${uploadDate}</td> <td>${element.progress}%</td> <td>${element.pages}</td> <td>${element.tentativePages}</td> <td>${element.finalPages}</td> <td data-toggle="modal" class="doc${element.status}" data-target="#doc${element.status}">${status}</td> <td data-toggle="modal" data-target="#paymentInfo" class="payment${element.paymentStatus} font-weight-bold payments">${paymentStatus}</td> </tr>`)
                    });
                }
            } 

        }
    })
}

const truncateString = function(text, length) {
    if (text.length > length) {
        text = text.substr(0, length) + "...";
    }
    return text;
}

const validateFields = function() {
    var $parent = $('#submitDoc');
    var validated = true;

    $parent.find('input, select, textarea').each((index, element) => {
        clearFieldMessage($(element));
        var name = $(element).attr('name');
        var type = $(element).attr('type');

        if (type === 'file') {
            if (!$(element).get(0).files[0]) {
                showFieldError($(element), REQUIRED_FIELD_MSG);
                validated = false;
            } else {
                if (!documentRegisterObj.file || documentRegisterObj.file === ""){
                    showFieldError($(element), "Invalid File");
                    validated = false;
                }
            }
        } else if (type === 'select') {
            var value = $(element).val();
            if (!value || value === "") {
                showFieldError($(element), REQUIRED_FIELD_MSG);
                validated = false;
            } else {
                documentRegisterObj.serviceType = value;
            }
        } else if (type === 'text') {
            var value = $(element).val();
            if (!value || value === "") {
                showFieldError($(element), REQUIRED_FIELD_MSG)
                validated = false;
            } else {
                if (name === "documentName")
                    documentRegisterObj.documentName = value;
            }
        } else if (type === 'number') {
            var value = $(element).val();
            var regex = new RegExp(/^[0-9]+$/);
            if (!value || value === "") {
                showFieldError($(element), REQUIRED_FIELD_MSG)
                validated = false;
            } else if (!regex.test(value)) {
                showFieldError($(element), PAGE_INVALID);
                validated = false;
            } else {
                documentRegisterObj.uploadedPages = value;
            }
        } else {
            if (name === 'otherServiceType') {
                var value = $(element).val();
                if ($('select[name=serviceType]').val() === "OTHER") {
                    if (!value || value === "") {
                        showFieldError($(element), REQUIRED_FIELD_MSG);
                        validated = false;
                    } else {
                        documentRegisterObj.otherServiceType = value;
                    }
                }
            } else if (name === 'additionalInformation') {
                var value = $(element).val();
                if (value)
                    documentRegisterObj.additionalInformation = value;
            }
        }
    })
    return validated;
}

