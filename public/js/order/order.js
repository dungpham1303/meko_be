let currentPage = 0;
let pageSize = parseInt($('#page-size-selector').val());
let orderCache = [];
let inputStatus = $('#input_search_status').val();


function formatMoney(value) {
    return Math.floor(Number(value)).toLocaleString('en-US');
}

function loadOrder(status = inputStatus) {
    Swal.fire({
        title: 'Đang xử lý...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        onOpen: () => {
            swal.showLoading();
        }
    });

    $.ajax({
        url: `/api/order/list/?orderBy=created_at&sort=DESC&limit=999999&shipping_status=${status}`,
        method: 'GET',
        headers: {
            'Authorization': sessionStorage.getItem('token')
        },
        success: function(res) {
            Swal.close();

            // LỌC PENDING TẠI FRONTEND
            orderCache = res.data.content.filter(o => o.shipping_status !== 'PENDING');

            renderOrder();
        }
    });
}

function renderOrder() {
    const tbody = $('#kt_datatable1_body');
    tbody.empty();

    const totalItems = orderCache.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    if (currentPage >= totalPages) currentPage = totalPages - 1;
    if (currentPage < 0) currentPage = 0;

    const start = currentPage * pageSize;
    const end = start + pageSize;

    const pageData = orderCache.slice(start, end);

    pageData.forEach(order => {
        tbody.append(`
            <tr style="line-height:100px;">
                <td>${order.order_code}</td>
                <td>${order.customer_name}</td>
                <td>${order.customer_phone}</td>
                <td>${order.customer_address}</td>
                <td>${formatMoney(order.subtotal_amount)}</td>
                <td>${formatMoney(order.shipping_fee)}</td>
                <td>${formatMoney(order.total_amount)}</td>
                <td>${order.shipping_provider}</td>
                <td>
                    ${
                        order.shipping_status === "CREATED"
                        ? '<span class="label label-pill label-inline mr-2" style="background-color:#3b82f6;color:white">Đã tạo đơn</span>'

                        : order.shipping_status === "PICKING"
                        ? '<span class="label label-pill label-inline mr-2" style="background-color:#0ea5e9;color:white">Đang lấy hàng</span>'

                        : order.shipping_status === "PICKED"
                        ? '<span class="label label-pill label-inline mr-2" style="background-color:#6366f1;color:white">Đã lấy hàng</span>'

                        : order.shipping_status === "DELIVERING"
                        ? '<span class="label label-pill label-inline mr-2" style="background-color:#22c55e;color:white">Đang giao hàng</span>'

                        : order.shipping_status === "DELIVERED"
                        ? '<span class="label label-pill label-inline mr-2" style="background-color:#16a34a;color:white">Đã giao thành công</span>'

                        : order.shipping_status === "RETURN"
                        ? '<span class="label label-pill label-inline mr-2" style="background-color:#f97316;color:white">Hoàn hàng</span>'

                        : order.shipping_status === "CANCEL"
                        ? '<span class="label label-pill label-inline mr-2" style="background-color:#ef4444;color:white">Đã huỷ</span>'
                        
                        : ''
                    }
                </td>

                <td style="text-align: center;padding-left:0;">
                    <span class="svg-icon svg-icon-primary svg-icon-2x"><!--begin::Svg Icon | path:C:\wamp64\www\keenthemes\themes\metronic\theme\html\demo1\dist/../src/media/svg/icons\Communication\Write.svg-->
                        <svg data-id="${order.id}" class="btn-edit-order" style="cursor: pointer; width: 36px !important;height: 36px !important;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
                            <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                <rect x="0" y="0" width="24" height="24"/>
                                <path d="M12.2674799,18.2323597 L12.0084872,5.45852451 C12.0004303,5.06114792 12.1504154,4.6768183 12.4255037,4.38993949 L15.0030167,1.70195304 L17.5910752,4.40093695 C17.8599071,4.6812911 18.0095067,5.05499603 18.0083938,5.44341307 L17.9718262,18.2062508 C17.9694575,19.0329966 17.2985816,19.701953 16.4718324,19.701953 L13.7671717,19.701953 C12.9505952,19.701953 12.2840328,19.0487684 12.2674799,18.2323597 Z" fill="#000000" fill-rule="nonzero" transform="translate(14.701953, 10.701953) rotate(-135.000000) translate(-14.701953, -10.701953) "/>
                                <path d="M12.9,2 C13.4522847,2 13.9,2.44771525 13.9,3 C13.9,3.55228475 13.4522847,4 12.9,4 L6,4 C4.8954305,4 4,4.8954305 4,6 L4,18 C4,19.1045695 4.8954305,20 6,20 L18,20 C19.1045695,20 20,19.1045695 20,18 L20,13 C20,12.4477153 20.4477153,12 21,12 C21.5522847,12 22,12.4477153 22,13 L22,18 C22,20.209139 20.209139,22 18,22 L6,22 C3.790861,22 2,20.209139 2,18 L2,6 C2,3.790861 3.790861,2 6,2 L12.9,2 Z" fill="#000000" fill-rule="nonzero" opacity="0.3"/>
                            </g>
                        </svg>
                    </span>
                </td>
            </tr>
        `);
    });

    // Text + button
    $('#current-page').text(totalPages === 0 ? 0 : currentPage + 1);
    $('#total-pages').text(totalPages);

    const from = totalItems === 0 ? 0 : start + 1;
    const to = Math.min(end, totalItems);
    $('#pagination-text').text(`Hiển thị ${from}-${to} của ${totalItems} bản ghi`);

    $('#prev-page').prop('disabled', currentPage === 0);
    $('#next-page').prop('disabled', currentPage >= totalPages - 1);
}

$('#prev-page').on('click', function () {
    currentPage--;
    renderOrder();
});

$('#next-page').on('click', function () {
    currentPage++;
    renderOrder();
});

$('#page-size-selector').on('change', function () {
    pageSize = parseInt($(this).val());
    currentPage = 0;
    renderOrder();
});

$(document).ready(function () {
    loadOrder();
});

$(document).on('click', '.btn-edit-order', function() {
    const orderId = $(this).data('id');
    Swal.fire({
        title: 'Đang xử lý...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        onOpen: () => {
            swal.showLoading();
        }
    });
    $.ajax({
        url: `/api/order/detail/${orderId}`,
        method: 'GET',
        headers: {
            'Authorization': sessionStorage.getItem('token')
        },
        success: function (res) {
            Swal.close();
            const order = res.data;
            $('#order_status_badge').html(`
                ${
                    order.shipping_status === "CREATED"
                    ? '<span class="label label-pill label-inline mr-2" style="background-color:#3b82f6;color:white">Đã tạo đơn</span>'

                    : order.shipping_status === "PICKING"
                    ? '<span class="label label-pill label-inline mr-2" style="background-color:#0ea5e9;color:white">Đang lấy hàng</span>'

                    : order.shipping_status === "PICKED"
                    ? '<span class="label label-pill label-inline mr-2" style="background-color:#6366f1;color:white">Đã lấy hàng</span>'

                    : order.shipping_status === "DELIVERING"
                    ? '<span class="label label-pill label-inline mr-2" style="background-color:#22c55e;color:white">Đang giao hàng</span>'

                    : order.shipping_status === "DELIVERED"
                    ? '<span class="label label-pill label-inline mr-2" style="background-color:#16a34a;color:white">Đã giao thành công</span>'

                    : order.shipping_status === "RETURN"
                    ? '<span class="label label-pill label-inline mr-2" style="background-color:#f97316;color:white">Hoàn hàng</span>'

                    : order.shipping_status === "CANCEL"
                    ? '<span class="label label-pill label-inline mr-2" style="background-color:#ef4444;color:white">Đã huỷ</span>'

                    : ''
                }
            `);
            $('.modal-footer').html(`
                ${
                    order.shipping_status === "CREATED"
                    ? `
                        <button type="button" class="btn btn-light-primary" data-dismiss="modal">Huỷ</button>
                        <button id="btn_save_edit" data-next="PICKING"
                            style="background:#0ea5e9;border:none"
                            class="btn-update-status btn text-white">Đang lấy hàng <i style="color:white" class="fas fa-arrow-right mx-2"></i></button>
                    `

                    : order.shipping_status === "PICKING"
                    ? `
                        <button type="button" class="btn btn-light-primary" data-dismiss="modal">Huỷ</button>
                        <button id="btn_save_edit" data-next="PICKED"
                            style="background:#6366f1;border:none"
                            class="btn-update-status btn text-white">Đã lấy hàng <i style="color:white" class="fas fa-arrow-right mx-2"></i></button>
                    `

                    : order.shipping_status === "PICKED"
                    ? `
                        <button type="button" class="btn btn-light-primary" data-dismiss="modal">Huỷ</button>
                        <button id="btn_save_edit" data-next="DELIVERING"
                            style="background:#22c55e;border:none"
                            class="btn-update-status btn text-white">Đang giao hàng <i style="color:white" class="fas fa-arrow-right mx-2"></i></button>
                    `

                    : order.shipping_status === "DELIVERING"
                    ? `
                        <button type="button" class="btn btn-light-primary" data-dismiss="modal">Huỷ</button>
                        <button id="btn_save_edit" data-next="DELIVERED"
                            style="background:#16a34a;border:none"
                            class="btn-update-status btn text-white">Hoàn tất đơn hàng <i style="color:white" class="fas fa-arrow-right mx-2"></i></button>
                    `
                    : ''
                }
            `);

            $('#order_code_hidden').val(order.ghn_order_code);
            $('#current_shipping_status').val(order.shipping_status);
            $('#shop_name').val(order.from_name);
            $('#shop_phone').val(order.from_phone);
            $('#shop_address').val(order.from_address);
            $('#customer_name').val(order.customer_name);
            $('#customer_phone').val(order.customer_phone);
            $('#customer_address').val(order.to_ward_name + ', ' + order.to_district_name + ', ' + order.to_province_name);
            $('#required_note').val(order.required_note);
            $('#exampleModalCenter').modal('show');
        },
        error: function(err) {
            Swal.close();
            Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: err.responseJSON?.message,
                confirmButtonText: 'Đóng'
            });
            console.error('Không thể tải thông tin chi tiết đơn hàng:', err);
        }
    });
});

$(document).on('click', '.btn-update-status', function () {
    const NEXT_STATUS_FLOW = {
        CREATED: 'PICKING',
        PICKING: 'PICKED',
        PICKED: 'DELIVERING',
        DELIVERING: 'DELIVERED'
    };
    const orderCode = $('#order_code_hidden').val();
    const currentStatus = $('#current_shipping_status').val();
    const nextStatus = NEXT_STATUS_FLOW[currentStatus];
    if (!nextStatus) {
        Swal.fire({
            icon: 'warning',
            title: 'Không thể cập nhật',
            text: 'Trạng thái này không được phép cập nhật tiếp!'
        });
        return;
    }
    const data = {
        order_code: orderCode,
        status: nextStatus.toLowerCase()
    };
    Swal.fire({
        title: 'Đang xử lý...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        onOpen: () => {
            swal.showLoading();
        }
    });
    $.ajax({
        url: '/api/order/ghn/webhook',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        headers: {
            'Authorization': sessionStorage.getItem('token')
        },
        success: function(res) {
            Swal.close();
            Swal.fire({
                icon: 'success',
                title: 'Cập nhật trạng thái thành công',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                $('#exampleModalCenter').modal('hide');
                loadOrder();
            });
        },
        error: function(err) {
            Swal.close();
            Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: err.responseJSON?.message || 'Cập nhật trạng thái thất bại!',
                confirmButtonText: 'Đóng'
            });
            console.error('Không thể cập nhật trạng thái đơn hàng:', err);
        }
    });
});

$(document).on('click', '#kt_search_4', function(e) {
    e.preventDefault();

    const status = $('#input_search_status').val();
    loadOrder(status);
});

$(document).on('click', '#kt_reset_4', function(e) {
    e.preventDefault();
    $('#input_search_status').val('');
    loadOrder();
});