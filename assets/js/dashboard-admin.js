var documentListObj = {
    sortColumn: "id",
    sortOrder: "desc",
    pageSize: 15,
    pageIndex: 0,
    fetchAllRecords: false,
    searchText: "",
    priority: null
}

// var documentRegisterObj = {
//     file:"",
//     documentName:"",
//     serviceType:"",
//     otherServiceType:"",
//     uploadedPages:"",
//     priority:"",
//     additionalInformation: null
// }

$(document).ready(function() {
    if (!AUTH_TOKEN)
        location.href = API.getBaseURL('/admin/login.html');
    getDocumentList();
})

$('a.cta-logout').on('click', function() {
    logout();
})

$('a.filter').on('click', function() {
    var filter = $(this).attr('data-filter');
    getDocumentList(filter);
})

// $(document).on('click', '#uploadDoc .type', function() {
//     var type = $(this).attr('data-priority');
//     documentRegisterObj.priority = type;
//     $(this).closest('.modal').modal('hide');
//     $('#submitDoc').modal('show');
// })

// $('#submitDoc').on('show.bs.modal', function() {
//     var date = new Date().toLocaleDateString().replaceAll("/", "-");
//     $(this).find('input[name=date]').val(date);
// })

$(document).on('change', 'input[type=file][name=file]', function() {
    var type = $(this).attr('data-type');
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
                    if (type === "SAMPLE")
                        $('#sampleDoc').find('.file-control').attr('data-filename', data.data.name);
                    else
                        documentRegisterObj.file = data.data.name
                    showToast(TOAST.success, FILE_UPLOAD_SUCCESS);
                } else if (data.status === false) {
                    showAjaxError(data);
                }
            }
        })
    }
})

// $('#submitDoc span.remove-file').on('click', function() {
//     $(this).parent().find('input[name=file][type=file]').val('');
//     documentRegisterObj.file = '';
// })

// $('#submitDoc .cta-submit').on('click', function() {
//     if (!validateFields()) {
//         return showToast(TOAST.error, ERRORS_IN_FORM);
//     } else {
//         $(this).addClass('disable-btn');
//         $.ajax({ 
//             type: "POST",
//             url: API.getAPIEndPoint('/document/submit'),
//             data: JSON.stringify(documentRegisterObj),
//             success: function(data) {
//                 if (data.status === true) {
//                     showToast(TOAST.success, data.message);
//                     setTimeout(() => {
//                         location.href = API.getBaseURL('/dashboard.html');
//                     }, 2000)
//                 } else if (data.status === false) {
//                     showAjaxError(data);
//                     $(this).removeClass('disable-btn');
//                 }
//             }
//         })
//     }
// })

// $('#submitDoc select[name=serviceType]').on('change', function() {
//     var selected = $(this).val();
//     if (selected && selected === "OTHER") {
//         $(this).closest('form').find('textarea[name=otherServiceType]').closest('.form-group').removeClass('display-n');
//     } else {
//         $(this).closest('form').find('textarea[name=otherServiceType]').closest('.form-group').addClass('display-n');
//     }
// })

$(document).on('click', 'a.sample-submit', function() {
    var $file = $(this).closest('.modal-content').find('input[type=file]');
    if (!$file || !$file.get(0).files[0]) {
        showFieldError($file, REQUIRED_FIELD_MSG);
        validated = false;
    } else if ($file.get(0).files[0].type !== "application/pdf"){
        showFieldError($file, "Sample Format should be PDF only");
    } else {
        var filename = $file.attr('data-filename');
        if (filename) {
            $.ajax({
                type: "POST",
                url: API.getAPIEndPoint("/admin/sample") + "?fileName="+ filename,
                success: function(data) {
                    showToast(TOAST.success, data.message);
                    $file.val('');
                    $(this).closest('#sampleDoc').modal('hide');
                }
            })
        }
    }
})

$(document).on('click', 'td.editable-field', function() {
    $(this).closest('tr').find('#updateDoc').modal('show');
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

                        var modalData = ` <div class="modal fade" id="updateDoc" tabindex="-1" aria-labelledby="uploadDocRegularLabel" aria-hidden="true"> <div class="modal-dialog modal-dialog-centered custom-modal-width"> <div class="modal-content card custom-modal-container"> <div class="d-flex justify-content-between mb-4"> <h5 class="modal-title" id="uploadDocRegularLabel">Update Document Details</h5> <button type="button" class="close" data-dismiss="modal" aria-label="Close"> <span class="cross" aria-hidden="true">&times;</span> </button> </div><p class="docTitle">Document ID: <span>${element.documentID}</span></p> <form data-id="${element.documentID}"> <div class="row"> <div class="col-sm-12 col-md-4"> <div class="form-group mt-4"> <label for="uploadedPages">Progress</label> <input type="number" value="${element.progress}" class="form-control" name="progress"> </div> </div> <div class="col-sm-12 col-md-4"> <div class="form-group mt-4"> <label for="uploadedPages">Tentative Pages</label> <input type="number" value="${element.tentativePages}" class="form-control" name="tentativePages"> </div> </div> <div class="col-sm-12 col-md-4"> <div class="form-group mt-4"> <label for="uploadedPages">Final Pages</label> <input type="number" class="form-control" value="${element.finalPages}" name="finalPages"> </div> </div> </div> <a class="custom-button pull-right cta-submit" href="javascript:void(0)">Confirm</a> </form> </div> </div> </div>`
    
                        $body.append(` <tr> <th class="${element.notifyUser !== true ? "notify" : ""}" scope="row"><a title="Click to download original Document" href="${API.getAPIEndPoint('/file/download?fileName=' + element.file.name)}">${element.documentID}</a></th> <td class="truncate" title="${element.documentName}">${documentName}</td> <td class="editable-field" title="Click to Update"><span>${element.progress}%</span></td> <td class="editable-field" title="Click to Update"><span>${element.tentativePages}</span></td> <td class="editable-field" title="Click to Update"><span>${element.finalPages}</span></td> <td>${element.userEmail}</td> <td data-toggle="modal" data-target="#paymentInfo" class="payment${element.paymentStatus} font-weight-bold payments">${paymentStatus}</td> <td data-toggle="modal" class="doc${element.status}" data-target="#doc${element.status}">${status}</td> <td><a data-toggle="modal" data-target="#uploadFile" href="#" class="custom-button custom-button-small">Upload File</a></td> </tr>`)
                        $body.find('tr').last().append(modalData);
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

