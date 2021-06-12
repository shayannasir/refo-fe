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

const actionItemsHTML = '<img data-type="yes" class="icon ml-1" src="assets/icons/check-solid.svg"><img data-type="no" class="icon ml-1" src="assets/icons/times-solid.svg">';

$(document).ready(function() {
    if (!AUTH_TOKEN)
        location.href = API.getBaseURL('/login.html');
    getSampleDocument();
    getDocumentList();
    fetchDelayed();
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
            beforeSend: function() {
                showToast(TOAST.info, "Uploading File...");
            },
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
        $(this).addClass('disable-btn');
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
                    $(this).removeClass('disable-btn');
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

$(document).on('click', 'td.doc.final', function() {
    var paymentStatus = $(this).closest('tr').find('.payments').attr('data-status');
    if (paymentStatus !== "PAID") {
        $('#finalDoc').find('.jf-1').addClass('display-n');
        $('#finalDoc').find('.alert').removeClass('display-n');
    }
    var finalDoc = $(this).attr('data-final-doc');
    if (finalDoc && finalDoc.length && finalDoc !== 'null')
        $('#finalDoc').find('a.final-download').attr('href', API.getAPIEndPoint('/file/download?fileName=' + finalDoc));
    $('#finalDoc').find('a.final-download').attr('data-status', paymentStatus);
    $('#finalDoc').modal('show');
})

$(document).on('click', 'td.doc-actions img', function() {
    var reqObj = {};
    var type = $(this).attr('data-type');
    var docID = $(this).closest('tr').find('th a').html();
    reqObj['documentID'] = docID;
    reqObj['action'] = type === "yes" ? true : false;
    var msg = type === "yes" ? "ACCEPT" : "REJECT";
    if (confirm("Are you sure you want to " + msg + " ?")) {
        $.ajax({
            type: "POST",
            url: API.getAPIEndPoint('/document/accept'),
            data: JSON.stringify(reqObj),
            success: function(data) {
                if (data.status === true) {
                    showToast(TOAST.success, data.message)
                    setTimeout(()=> {
                        getDocumentList();
                    }, 500)
                } else if (data.status === false) {
                    showAjaxError(data);
                }
            }
        })
    }
})

$(document).on('click', '#docFIRST_DRAFT .cta-submit', function() {
    var reqObj = {};
    var $target = $(this);
    reqObj['documentID'] = $(this).attr('data-id');
    var feedbackField = $(this).closest('.row').find('textarea');
    if (!feedbackField || !feedbackField.val() || !feedbackField.val().trim())
        return showFieldError(feedbackField, REQUIRED_FIELD_MSG);
    reqObj['feedback'] = feedbackField.val();
    $.ajax({
        type: "POST",
        url: API.getAPIEndPoint('/document/feedback'),
        data: JSON.stringify(reqObj),
        success: function(data) {
            if (data.status === true) {
                showToast(TOAST.success, data.message);
                $target.closest('#docFIRST_DRAFT').modal('hide');
                setTimeout(() => {
                    getDocumentList();
                }, 500)
            } else if (data.status === false) {
                showAjaxError(data);
            }
        }
    })
})

$(document).on('click', 'td.docFIRST_DRAFT', function() {
    var docID = $(this).closest('tr').find('th a').html();
    var draftFile = $(this).attr('data-file');
    $('#docFIRST_DRAFT').find('.cta-submit').attr('data-id', docID);
    $('#docFIRST_DRAFT').find('.draft-download').attr('href', API.getAPIEndPoint('/file/download?fileName=' + draftFile));
    $('#docFIRST_DRAFT').modal('show');
})

$(document).on('hidden.bs.modal', '#docFIRST_DRAFT', function () {
    $(this).find('input[type=file]').val('')
    $(this).find('textarea').val('')
    $(this).find('p.error').remove();
    $(this).find('.cta-submit').removeAttr('data-id');
    $(this).find('.draft-download').attr('href', 'javascript:void(0)');
});

$(document).on('hidden.bs.modal', '#finalDoc', function () {
    $(this).find('.final-download').removeAttr('data-status');
    $(this).find('.final-download').attr('href', 'javascript:void(0)');
    $(this).find('.jf-1').removeClass('display-n');
    $(this).find('.alert').addClass('display-n');
});

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
                        var isActionbleItems = element.status === STATUS.pending && element.notifyUser === true;
                        var isDraft = element.status === STATUS.draft && element.notifyUser === true;
                        var isFInal = element.status === STATUS.final;
    
                        $body.append(` <tr> <th class="${element.notifyUser === true ? "notify" : ""}" scope="row"><a title="Click to download original Document" href="${API.getAPIEndPoint('/file/download?fileName=' + element.file.name)}">${element.documentID}</th> <td class="truncate" title="${element.documentName}">${documentName}</td> <td>${uploadDate}</td> <td>${element.progress}%</td> <td>${element.pages}</td> <td class="action doc-actions">${element.tentativePages}${isActionbleItems ? actionItemsHTML : ""}</td> <td>${element.finalPages}</td> <td data-file="${isDraft && element.firstPage && element.firstPage.name ? element.firstPage.name : ""}" class="doc${isDraft ? element.status : ""} ${isFInal ? 'final' : ""} status" data-final-doc="${element.finalDraft && element.finalDraft.name ? element.finalDraft.name : ""}">${status}</td> <td data-toggle="modal" data-target="#paymentInfo" data-status="${element.paymentStatus}" class="payment${element.paymentStatus} font-weight-bold payments">${paymentStatus}</td> </tr>`)

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

const getSampleDocument = function() {
    $.ajax({
        type: "GET",
        url: API.getAPIEndPoint("/admin/sample"),
        success: function(data) {
            if (data.status === true) {
                $("#sampleDoc").find('a.sample-doc').attr('href', API.getAPIEndPoint('/file/download?fileName=') + data.message);
            } else {
                $("#sampleDoc").find('a.sample-doc').css('pointer-events', 'none');
            }
        }
    })
}

const fetchDelayed = function() {
    $.ajax({
        type: "GET",
        url: API.getAPIEndPoint('/admin/get/delayed'),
        async: false,
        success: function(data) {
            if (data) {
                if (data.isDelayed) {
                    $('#uploadDoc').find('.regular').addClass('display-n');
                    $('#uploadDoc').find('.delayed').removeClass('display-n');
                }
            }
        }
    })
}