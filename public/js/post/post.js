let currentPage = 0;
let pageSize = parseInt($('#page-size-selector').val());
let searchText = '';
let inputStatus = $('#input_search_status').val();

function formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
}

function loadPost(page=0, size=pageSize,searchText = '',status = inputStatus) {
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
        url: `/api/post/search-post?page=${page}&size=${size}`,
        method: 'POST',
        contentType: 'application/json',
        headers: {
            'Authorization': sessionStorage.getItem('token')
        },
        data: JSON.stringify({
            searchText: searchText,
            status: status
        }),
        success: function(res) {
            Swal.close();
            const tbody = $('#kt_datatable1_body');
            tbody.empty();
            res.data.content.forEach(post => {
                tbody.append(`
                    <tr style="line-height: 100px;">
                        <td>${post.id}</td>
                        <td>${post.userNamePoster}</td>
                        <td>
                            <div class="d-flex flex-column">
                                ${
                                    (post.categories || [])
                                    .map((cat, index) => {
                                        const colors = ['success', 'danger', 'warning', 'info', 'primary']; 
                                        const color = colors[index % colors.length]; 
                                        return `<span class="m-1 label label-${color} label-pill label-inline mr-2">${cat}</span>`;
                                    })
                                    .join(' ')
                                }
                            </div>
                        </td>
                        <td><img style="border-radius: 16px;width:80px;height:80px;object-fit:cover;" src="${post.images[0]}" alt=""></td>
                        <td>${post.title}</td>
                        <td>${post.description}</td>
                        <td>${post.address}</td>
                        <td>
                            <span class="badge-dynamic ${post.oldProductPercent >= 50 ? 'low' : post.oldProductPercent >= 18 ? 'medium' : 'hot'}">
                                ${post.oldProductPercent || 0}%
                            </span>
                        </td>
                        <td>${post.price}</td>
                        <td>
                            ${
                                post.status === "EXPIRED" 
                                ? '<span class="label label-pill label-inline mr-2 badge-dynamic" style="background-color: #CC66FF;">Hết hạn</span>'
                                : post.status === "VIOLATION" 
                                ? '<span class="label label-danger label-pill label-inline mr-2 badge-dynamic">Vi phạm</span>'
                                : post.status === "APPROVED"
                                ? '<span class="label label-success label-pill label-inline mr-2 badge-dynamic">Phê duyệt</span>'
                                : post.status === "PENDING"
                                ? '<span class="label label-primary label-pill label-inline mr-2 badge-dynamic">Chờ duyệt</span>'
                                : post.status === "HIDDEN"
                                ? '<span class="label label-secondary label-pill label-inline mr-2 badge-dynamic">Ẩn tin</span>'
                                : post.status === "REJECTED"
                                ? '<span class="label label-warning label-pill label-inline mr-2 badge-dynamic">Từ chối</span>'
                                : ''
                            }
                        </td>
                        <td>${formatDate(post.expiredAt)}</td>
                        <td>
                            ${
                                post.isPinned == 1
                                ? '<span class="label label-success label-pill label-inline mr-2 badge-dynamic">Đã ghim</span>'
                                : '<span class="label label-danger label-pill label-inline mr-2 badge-dynamic">Chưa ghim</span>'
                            }
                        </td>
                        <td style="text-align: center;padding-left:0;">
                            ${
                                post.isPinned == 1
                                ? '<span><svg data-id="' + post.id + '" class="btn-pin-post" style="width: 36px;height: 36px;cursor: pointer;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M73 39.1C63.6 29.7 48.4 29.7 39.1 39.1C29.8 48.5 29.7 63.7 39 73.1L567 601.1C576.4 610.5 591.6 610.5 600.9 601.1C610.2 591.7 610.3 576.5 600.9 567.2L449.8 416L480 416C490 416 499.5 411.3 505.5 403.3C511.5 395.3 513.5 384.9 510.7 375.2L507 361.8C494.6 318.5 466 283.3 428.8 262.1L418.5 128L448 128C465.7 128 480 113.7 480 96C480 78.3 465.7 64 448 64L192 64C184.6 64 177.9 66.5 172.5 70.6L222.1 120.3L217.3 183.4L73 39.1zM314.2 416L181.7 283.6C159 304.1 141.9 331 133 361.9L129.2 375.3C126.4 385 128.4 395.3 134.4 403.4C140.4 411.5 150 416 160 416L314.2 416zM288 576C288 593.7 302.3 608 320 608C337.7 608 352 593.7 352 576L352 464L288 464L288 576z"/></svg></span>'
                                : '<span><svg data-id="' + post.id + '" class="btn-pin-post" style="width: 36px;height: 36px;cursor: pointer;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M160 96C160 78.3 174.3 64 192 64L448 64C465.7 64 480 78.3 480 96C480 113.7 465.7 128 448 128L418.5 128L428.8 262.1C465.9 283.3 494.6 318.5 507 361.8L510.8 375.2C513.6 384.9 511.6 395.2 505.6 403.3C499.6 411.4 490 416 480 416L160 416C150 416 140.5 411.3 134.5 403.3C128.5 395.3 126.5 384.9 129.3 375.2L133 361.8C145.4 318.5 174 283.3 211.2 262.1L221.5 128L192 128C174.3 128 160 113.7 160 96zM288 464L352 464L352 576C352 593.7 337.7 608 320 608C302.3 608 288 593.7 288 576L288 464z"/></svg></span>'
                            }
                            <span class="svg-icon svg-icon-primary svg-icon-2x"><!--begin::Svg Icon | path:C:\wamp64\www\keenthemes\themes\metronic\theme\html\demo1\dist/../src/media/svg/icons\Communication\Write.svg-->
                                <svg id="btn_edit_post" data-id="${post.id}" class="btn-edit-post" style="cursor: pointer; width: 36px !important;height: 36px !important;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
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
            // cập nhật phân trang
            $('#current-page').text(res.data.pagination.currentPage + 1);
            $('#total-pages').text(res.data.pagination.totalPages);

            const start = res.data.pagination.totalElements === 0 ? 0 : res.data.pagination.currentPage * res.data.pagination.size + 1;
            const end = Math.min((res.data.pagination.currentPage + 1) * res.data.pagination.size, res.data.pagination.totalElements);

            $('#pagination-text').text(`Hiển thị ${start}-${end} của ${res.data.pagination.totalElements} bản ghi`);

            $('#prev-page').prop('disabled', res.data.pagination.currentPage <= 0);
            $('#next-page').prop('disabled', res.data.pagination.currentPage >= res.data.pagination.totalPages - 1);
        },
        error: function(err) {
            console.error('Không thể tải danh sách category:', err);
        }
    });
}

$('#prev-page').on('click', function() {
    if (currentPage > 0) {
        currentPage--;
        loadPost(currentPage, pageSize, searchText, inputStatus);
    }
});

$('#next-page').on('click', function() {
    currentPage++;
    loadPost(currentPage, pageSize, searchText, inputStatus);
});

$('#page-size-selector').on('change', function() {
    pageSize = parseInt($(this).val());
    currentPage = 0;
    loadPost(currentPage, pageSize, searchText, inputStatus);
});

$(document).ready(function() {
    loadPost(currentPage, pageSize);

    $(document).on('click', '.btn-pin-post', function() {
        const postId = $(this).data('id');
        $.ajax({
            url: '/api/post/update-is-pinned/' + postId,
            type: 'PUT',
            headers: {
                'Authorization': sessionStorage.getItem('token')
            },
            success: function(res) {
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công!',
                    text: res.message,
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    loadPost(currentPage, pageSize);
                });
            },
            error: function(err) {
                console.error('Không thể pin bài viết:', err);
            }
        });
    });

    $(document).on('click', '.btn-edit-post', function() {
        const postId = $(this).data('id');
        $.ajax({
            url: '/api/post/detail/' + postId,
            type: 'GET',
            headers: {
                'Authorization': sessionStorage.getItem('token')
            },
            success: function(res) {
                const htmlEdit = `
                    <div class="modal-body">
                        <form id="userForm">
                            <div class="form-group d-flex justify-content-center">
                                <div class="sub-image-slider" 
                                    style="
                                    display:flex;
                                    gap:8px;
                                    overflow-x:auto;
                                    flex-wrap: nowrap;
                                    ">
                                    ${res.data.images && res.data.images.length >= 1 ? res.data.images.map((img, i) => 
                                        `
                                            <img 
                                            src="${img}" 
                                            class="sub-image-item"
                                            data-index="${i}"
                                            style="
                                                width:280px;
                                                height:280px;
                                                object-fit:cover;
                                                border-radius:12px;
                                                cursor:pointer;
                                                flex-shrink:0;
                                                border:2px solid transparent;
                                                transition:all 0.2s ease;
                                            "
                                            alt="Ảnh phụ"
                                            />
                                        `
                                    ).join('')
                                    : ''
                                    }
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Tên tác giả:</label>
                                <input value="${res.data.userNamePoster}" type="text" class="form-control" readonly>
                            </div>

                            <div class="form-group">
                                <label>Tiêu đề:</label>
                                <input value="${res.data.title}" type="text" class="form-control" readonly>
                            </div>

                            <div class="form-group">
                                <label>Mô tả:</label>
                                <textarea class="form-control" rows="4" readonly>${res.data.description}</textarea>
                            </div>

                            <div class="form-group">
                                <label>Giá:</label>
                                <input value="${res.data.price}" type="text" class="form-control" readonly>
                            </div>

                            <div class="form-group">
                                <label>Địa chỉ:</label>
                                <input value="${res.data.address}" type="text" class="form-control" readonly>
                            </div>

                            <div class="form-group">
                                <label>Số điện thoại:</label>
                                <input value="${res.data.phoneNumber}" type="text" class="form-control" readonly>
                            </div>

                            <div class="form-group">
                                <label>Trạng thái:</label>
                                <select id="status_post_edit" class="form-control">
                                    <option value="PENDING" ${res.data.status === 'PENDING' ? 'selected' : ''}>Chờ duyệt</option>
                                    <option value="VIOLATION" ${res.data.status === 'VIOLATION' ? 'selected' : ''}>Vi phạm</option>
                                    <option value="APPROVED" ${res.data.status === 'APPROVED' ? 'selected' : ''}>Phê duyệt</option>
                                    <option value="REJECTED" ${res.data.status === 'REJECTED' ? 'selected' : ''}>Từ chối</option>
                                    <option value="HIDDEN" ${res.data.status === 'HIDDEN' ? 'selected' : ''}>Ẩn tin</option>
                                </select>
                            </div>

                        </form>
                    </div>
                `;

                $('#modalContent_body').html(htmlEdit);
                $('#exampleModalCenter').modal('show');

                const status = res.data.status;
                const $select = $('#status_post_edit');

                if (status === 'VIOLATION') {
                    // Chỉ hiển thị "Vi phạm" và khóa select
                    $select.find('option').hide();
                    $select.find('option[value="VIOLATION"]').show();
                    $select.val('VIOLATION');
                    $select.prop('disabled', true);
                    $select.css({
                        'appearance': 'none',          
                        '-webkit-appearance': 'none',
                        '-moz-appearance': 'none',
                        'background-color': '#dc3545', 
                        'color': 'white',         
                        'background-image': 'none',   
                        'cursor': 'not-allowed'        
                    });
                } else if (status === 'PENDING') {
                    // Chỉ hiển thị 3 option: Chờ duyệt, Phê duyệt, Từ chối
                    $select.find('option').hide();
                    $select.find('option[value="PENDING"]').show();
                    $select.find('option[value="APPROVED"]').show();
                    $select.find('option[value="REJECTED"]').show();
                    $select.prop('disabled', false);
                } else if (status === 'APPROVED') {
                    // Chỉ hiển thị 2 option: ẩn tin, phê duyệt
                    $select.find('option').hide();
                    $select.find('option[value="APPROVED"]').show();
                    $select.find('option[value="HIDDEN"]').show();
                    $select.prop('disabled', false);
                } else if (status === 'REJECTED') {
                    // Chỉ hiển thị 2 option: Từ chối, chờ duyệt
                    $select.find('option').hide();
                    $select.find('option[value="PENDING"]').show();
                    $select.prop('disabled', false);
                } else if (status === 'HIDDEN') {
                    // Chỉ hiển thị 2 option: ẩn tin, phê duyệt
                    $select.find('option').hide();
                    $select.find('option[value="HIDDEN"]').show();
                    $select.find('option[value="APPROVED"]').show();
                    $select.prop('disabled', false);
                } else {
                    // Các trạng thái khác thì hiển thị đầy đủ, cho phép chọn
                    $select.find('option').show();
                    $select.prop('disabled', false);
                }

                $(document).on('change', '#status_post_edit', function () {
                    const selected = $(this).val();

                    $('#reasonContainer').remove();

                    if (selected === 'REJECTED') {
                        const reasonHtml = `
                            <div id="reasonContainer" class="form-group mt-3">
                                <label>Lý do từ chối:</label>
                                <input id="reasonInput" type="text" class="form-control" placeholder="Nhập lý do..." required>
                            </div>
                        `;
                        $(this).closest('.form-group').after(reasonHtml);
                    }
                });

                $(document).off('click', '#btn_save_edit').on('click', '#btn_save_edit', async  function() {

                    const status = $('#status_post_edit').val();
                    const reason = $('#reasonInput').val() || '';
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
                        url: '/api/post/update-status/' + postId,
                        type: 'PUT',
                        data: {
                            status: status,
                            reasonReject: reason
                        },
                        headers: {
                            'Authorization': sessionStorage.getItem('token')
                        },
                        success: function(res) {
                            Swal.close();
                            Swal.fire({
                                icon: 'success',
                                title: 'Thành công!',
                                text: res.message,
                                timer: 2000,
                                showConfirmButton: false
                            });
                            $('#exampleModalCenter').modal('hide');
                            loadPost(currentPage, pageSize, searchText);
                        },
                        error: function(err) {
                            Swal.close();
                            Swal.fire({
                                icon: 'error',
                                title: 'Thất bại!',
                                text: err.responseJSON?.message || 'Không thể thay đổi trạng thái bài viết. Vui lòng thử lại!',
                                confirmButtonText: 'Đóng'
                            });
                            console.error('Không thể thay đổi trạng thái bài viết:', err);
                        }
                    });
                });
            },
            error: function(err) {
                console.error('Không thể lấy thông tin chi tiết bài viết:', err);
            }
        });
    });

    $(document).on('click', '#kt_search_4', function(e) {
        e.preventDefault();

        const searchText = $('#input_search').val().trim();
        const status = $('#input_search_status').val();
        currentPage = 0;
        loadPost(currentPage, pageSize, searchText, status);
    });

    $(document).on('click', '#kt_reset_4', function(e) {
        e.preventDefault();
        $('#input_search').val('');
        $('#input_search_status').val('');
        searchText = '';
        loadPost(currentPage, pageSize, searchText);
    });

    // --- Ảnh full màn ---
    const overlay = document.getElementById('imageOverlay');
    const overlayImg = document.getElementById('overlayImage');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const counter = document.getElementById('imageCounter');

    // Lưu danh sách ảnh và index hiện tại
    let currentIndex = 0;
    let allImages = [];

    // Khi click ảnh nhỏ => hiển thị ảnh lớn
    $(document).on('click', '.sub-image-item', function () {
        allImages = Array.from(document.querySelectorAll('.sub-image-item')).map(img => img.src);
        currentIndex = parseInt($(this).attr('data-index'), 10);
        showImage(currentIndex);
    });

    function showImage(index) {
        overlayImg.style.opacity = 0;
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            overlayImg.src = allImages[index];
            overlayImg.onload = () => (overlayImg.style.opacity = 1);
        }, 150);

        // 👉 Cập nhật chỉ số
        counter.textContent = `${index + 1} / ${allImages.length}`;
    }

    // Nút next / prev
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % allImages.length;
        showImage(currentIndex);
    });

    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + allImages.length) % allImages.length;
        showImage(currentIndex);
    });

    // Đóng khi click ra ngoài hoặc bấm ESC
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target === overlayImg) {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
            counter.textContent = '';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (overlay.style.display === 'flex') {
            if (e.key === 'Escape') {
                overlay.style.display = 'none';
                document.body.style.overflow = '';
                counter.textContent = '';
            }
            if (e.key === 'ArrowRight') {
                currentIndex = (currentIndex + 1) % allImages.length;
                showImage(currentIndex);
            }
            if (e.key === 'ArrowLeft') {
                currentIndex = (currentIndex - 1 + allImages.length) % allImages.length;
                showImage(currentIndex);
            }
        }
    });

});
