function formatNumberDisplay(num) {
    if (num == null || num === '') return '';
    return Number(num).toLocaleString('en-US');
}

function loadPackages() {
    Swal.fire({
        title: 'Đang xử lý...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        onOpen: () => {
            Swal.showLoading();
        }
    });
    $.ajax({
        url: '/api/payment-package',
        method: 'GET',
        headers: {
            'Authorization': sessionStorage.getItem('token')
        },
        success: function(res) {
            Swal.close();
            const tbody = $('#kt_datatable1_body');
            tbody.empty();
            res.data.forEach(package => {
                const lockBtn = package.is_active == 1
                    ? `<button class="btn btn-danger btn-sm btn-lock" data-id="${package.id}" data-status="1">
                            <i class="fa fa-lock p-0"></i>
                    </button>`
                    : `<button class="btn btn-success btn-sm btn-lock" data-id="${package.id}" data-status="0">
                            <i class="fa fa-unlock p-0"></i>
                    </button>`;
                tbody.append(`
                    <tr style="line-height: 100px;">
                        <td>${package.id}</td>
                        <td>${package.name}</td>
                        <td>
                            ${
                                package.status == 0
                                ? '<span class="label label-success label-pill label-inline mr-2">Miễn phí</span>'
                                : '<span class="label label-danger label-pill label-inline mr-2">Tính phí</span>'
                            }
                        </td>
                        <td>${formatNumberDisplay(package.price)}</td>
                        <td>${package.description}</td>
                        <td>${formatNumberDisplay(package.duration_days)}</td>
                        <td>${formatNumberDisplay(package.usage_limit)}</td>
                        <td>
                            ${
                                package.is_active == 1
                                ? '<span class="label label-success label-pill label-inline mr-2">Đang hoạt động</span>'
                                : '<span class="label label-danger label-pill label-inline mr-2">Dừng hoạt động</span>'
                            }
                        </td>
                        <td style="text-align: center;padding-left:0;">
                            <span class="svg-icon svg-icon-primary svg-icon-2x"><!--begin::Svg Icon | path:C:\wamp64\www\keenthemes\themes\metronic\theme\html\demo1\dist/../src/media/svg/icons\Communication\Write.svg-->
                                <svg id="btn_edit_package" data-id="${package.id}" class="btn-edit-package" style="cursor: pointer; width: 36px !important;height: 36px !important;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
                                    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                        <rect x="0" y="0" width="24" height="24"/>
                                        <path d="M12.2674799,18.2323597 L12.0084872,5.45852451 C12.0004303,5.06114792 12.1504154,4.6768183 12.4255037,4.38993949 L15.0030167,1.70195304 L17.5910752,4.40093695 C17.8599071,4.6812911 18.0095067,5.05499603 18.0083938,5.44341307 L17.9718262,18.2062508 C17.9694575,19.0329966 17.2985816,19.701953 16.4718324,19.701953 L13.7671717,19.701953 C12.9505952,19.701953 12.2840328,19.0487684 12.2674799,18.2323597 Z" fill="#000000" fill-rule="nonzero" transform="translate(14.701953, 10.701953) rotate(-135.000000) translate(-14.701953, -10.701953) "/>
                                        <path d="M12.9,2 C13.4522847,2 13.9,2.44771525 13.9,3 C13.9,3.55228475 13.4522847,4 12.9,4 L6,4 C4.8954305,4 4,4.8954305 4,6 L4,18 C4,19.1045695 4.8954305,20 6,20 L18,20 C19.1045695,20 20,19.1045695 20,18 L20,13 C20,12.4477153 20.4477153,12 21,12 C21.5522847,12 22,12.4477153 22,13 L22,18 C22,20.209139 20.209139,22 18,22 L6,22 C3.790861,22 2,20.209139 2,18 L2,6 C2,3.790861 3.790861,2 6,2 L12.9,2 Z" fill="#000000" fill-rule="nonzero" opacity="0.3"/>
                                    </g>
                                </svg>
                            </span>
                            <span>${lockBtn}</span>
                        </td>
                    </tr>
                `);
            });
        },
        error: function(err) {
            console.error('Không thể tải danh sách category:', err);
        }
    });
}

function parseFormattedNumber(value) {
    if (!value) return 0;
    value = value.replace(/,/g, ''); // bỏ dấu phẩy hàng nghìn
    return parseFloat(value);       // giữ được số thập phân
}

function addPackage() {
    Swal.fire({
        title: 'Đang xử lý...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        onOpen: () => {
            Swal.showLoading();
        }
    });
    $.ajax({
        url: '/api/payment-package/create',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            name: $('#name_package').val(),
            description: $('#description_package').val(),
            price: parseFormattedNumber($('#price_package').val()),
            durationDays: parseFormattedNumber($('#duration_days').val()),
            usageLimit: parseFormattedNumber($('#usage_limit').val()),
            status: $('#status_post_edit').val()
        }),
        
        headers: {
            'Authorization': sessionStorage.getItem('token')
        },
        success: function(res) {
            Swal.close();
            $('#exampleModalCenter').modal('hide');
            Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: res.message,
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                loadPackages();
            });
        },
        error: function(err) {
            Swal.close();
            Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: err.responseJSON?.message || 'Không thể thêm danh mục. Vui lòng thử lại!',
                confirmButtonText: 'Đóng'
            });
            console.error('Không thể thêm danh mục:', err);
        }
    });
}

$(document).ready(function() {
    loadPackages();

    $('.btn-add-package').on('click', function() {
        const htmlAdd = `
            <div class="modal-header">
                <h5 class="modal-title">Thêm danh mục</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <i aria-hidden="true" class="ki ki-close"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="packageForm">
                    <div class="form-group">
                        <label>Tên gói:</label>
                        <input id="name_package" type="text" class="form-control" placeholder="Nhập tên gói" required>
                    </div>
                    <div class="form-group">
                        <label>Mô tả:</label>
                        <textarea id="description_package" class="form-control" placeholder="Nhập mô tả" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Giá:</label>
                        <input id="price_package" type="text" class="form-control" placeholder="Nhập giá" required>
                    </div>
                    <div class="form-group">
                        <label>Thời hạn (ngày):</label>
                        <input id="duration_days" type="text" class="form-control" placeholder="Nhập số ngày" required>
                    </div>
                    <div class="form-group">
                        <label>Giới hạn bài đăng:</label>
                        <input id="usage_limit" type="text" class="form-control" placeholder="Nhập số lượng bài đăng" required>
                    </div>
                    <div class="form-group">
                        <label>Loại gói:</label>
                        <select id="status_post_edit" class="form-control">
                            <option value="0">Miễn phí</option>
                            <option value="1">Tính phí</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-light-primary" data-dismiss="modal">Huỷ</button>
                <button id="btn_save_add" type="button" class="btn btn-primary btn-save-add">Thêm</button>
            </div>
        `;
        $('#modalContent').html(htmlAdd);
        $('#exampleModalCenter').modal('show');
    });

    $(document).on('click', '#btn_save_add', function() {
        addPackage();
    });

    $(document).on('click', '.btn-edit-package', function() {
        const packageId = $(this).data('id');
        $.ajax({
            url: '/api/payment-package/' + packageId,
            type: 'GET',
            headers: {
                'Authorization': sessionStorage.getItem('token')
            },
            success: function(res) {
                const htmlEdit = `
                    <div class="modal-header">
                        <h5 class="modal-title">Chỉnh sửa thông tin người dùng</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <i aria-hidden="true" class="ki ki-close"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form>
                            <div class="form-group">
                                <label>Tên gói:</label>
                                <input value="${res.data.name}" id="name_package_edit" type="text" class="form-control" placeholder="Nhập tên gói" required>
                            </div>
                            <div class="form-group">
                                <label>Mô tả:</label>
                                <textarea id="description_package_edit" class="form-control" placeholder="Nhập mô tả" required>${res.data.description}</textarea>
                            </div>
                            <div class="form-group">
                                <label>Giá:</label>
                                <input value="${res.data.price}" id="price_package_edit" type="text" class="form-control" placeholder="Nhập giá" required>
                            </div>
                            <div class="form-group">
                                <label>Thời hạn (ngày):</label>
                                <input value="${res.data.duration_days}" id="duration_days_edit" type="text" class="form-control" placeholder="Nhập số ngày" required>
                            </div>
                            <div class="form-group">
                                <label>Giới hạn bài đăng:</label>
                                <input value="${res.data.usage_limit}" id="usage_limit_edit" type="text" class="form-control" placeholder="Nhập số lượng bài đăng" required>
                            </div>
                            <div class="form-group">
                                <label>Loại gói:</label>
                                <select id="status_post_edit" class="form-control">
                                    <option value="0" ${res.data.status == 0 ? 'selected' : ''}>Miễn phí</option>
                                    <option value="1" ${res.data.status == 1 ? 'selected' : ''}>Tính phí</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-light-primary" data-dismiss="modal">Huỷ</button>
                        <button id="btn_save_edit" type="button" class="btn btn-primary btn-save-add">Lưu</button>
                    </div>
                `;
                $('#modalContent').html(htmlEdit);
                $('#exampleModalCenter').modal('show');

                $(document).off('click', '#btn_save_edit').on('click', '#btn_save_edit', async  function() {
                    Swal.fire({
                        title: 'Đang xử lý...',
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        showConfirmButton: false,
                        onOpen: () => {
                            Swal.showLoading();
                        }
                    });
                    $.ajax({
                        url: '/api/payment-package/update/' + packageId,
                        type: 'PUT',
                        contentType: 'application/json',
                        data: JSON.stringify({
                            name: $('#name_package_edit').val(),
                            description: $('#description_package_edit').val(),
                            price: parseFormattedNumber($('#price_package_edit').val()),
                            durationDays: parseFormattedNumber($('#duration_days_edit').val()),
                            usageLimit: parseFormattedNumber($('#usage_limit_edit').val()),
                            status: $('#status_post_edit').val()
                        }),
                        headers: {
                            'Authorization': sessionStorage.getItem('token')
                        },
                        success: function(res) {
                            Swal.close();
                            $('#exampleModalCenter').modal('hide');
                            Swal.fire({
                                icon: 'success',
                                title: 'Thành công!',
                                text: res.message,
                                timer: 1000,
                                showConfirmButton: false
                            }).then(() => {
                                loadPackages();
                            });
                        },
                        error: function(err) {
                            Swal.close();
                            Swal.fire({
                                icon: 'error',
                                title: 'Thất bại!',
                                text: err.responseJSON?.message || 'Không thể chỉnh sửa thông tin danh mục. Vui lòng thử lại!',
                                confirmButtonText: 'Đóng'
                            });
                            console.error('Không thể chỉnh sửa thông tin danh mục:', err);
                        }
                    });
                });
            },
            error: function(err) {
                console.error('Không thể lấy thông tin chi tiết danh mục:', err);
            }
        });
    });

    $(document).on('click', '.btn-lock', function() {
        const packageId = $(this).data('id');
        const status = $(this).data('status');
        const titleText = status == 1 ? 'Xác nhận khóa gói thanh toán?' : 'Xác nhận mở khóa gói thanh toán?';
        const is_active = status == 1 ? 0 : 1;
        Swal.fire({
            title: titleText,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy bỏ',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/api/payment-package/update/' + packageId,
                    type: 'PUT',
                    headers: {
                        'Authorization': sessionStorage.getItem('token')
                    },
                    contentType: 'application/json',
                    data: JSON.stringify({
                        isActive: is_active
                    }),
                    success: function(res) {
                        const message =res.data.is_active == 1
                            ? 'Mở khóa gói thành công!'
                            : 'Khóa gói thành công!';
                        Swal.fire({
                            icon: 'success',
                            title: message,
                            showConfirmButton: false,
                            timer: 1000
                        }).then(() => {
                            loadPackages();
                        });
                    },
                    error: function(err) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Lỗi!',
                            text: 'Không thể cập nhật gói thanh toán.',
                        });
                        console.error('Không thể cập nhật gói thanh toán:', err);
                    }
                });
            }
        });
    });

    function formatNumberInput(input) {
        let value = input.value;

        value = value.replace(/[^0-9.]/g, '');

        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }

        let integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        if (parts.length === 2) {
            value = integerPart + '.' + parts[1];
        } else {
            value = integerPart;
        }

        input.value = value;
    }

    $(document).on('input', '#price_package', function() {
        formatNumberInput(this);
    });

    $(document).on('input', '#usage_limit', function() {
        formatNumberInput(this);
    });

    $(document).on('input', '#duration_days', function() {
        formatNumberInput(this);
    });

    $(document).on('input', '#price_package_edit', function() {
        formatNumberInput(this);
    });

    $(document).on('input', '#usage_limit_edit', function() {
        formatNumberInput(this);
    });

    $(document).on('input', '#duration_days_edit', function() {
        formatNumberInput(this);
    });
});
