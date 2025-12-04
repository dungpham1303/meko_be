$(document).ready(function () {
    let $inputWrapper = $('#daterange_1').closest('.form-group');
    let $input = $('#daterange_1');

    $inputWrapper.addClass('d-none');

    $('#time_filter').on('change', function () {
        let type = $(this).val();
        $inputWrapper.addClass('d-none');
        if ($input.data('daterangepicker')) {
            $input.data('daterangepicker').remove();
        }
        if ($input.data('datepicker')) {
            $input.datepicker('destroy');
        }

        $input.val('');

        let start, end;

        switch (type) {
            case 'today':
                $input.daterangepicker({
                    singleDatePicker: false,
                    showDropdowns: true,
                    autoUpdateInput: true,
                    locale: { format: 'DD/MM/YYYY' }
                });

                start = moment();
                end = moment();

                $input.data('daterangepicker').setStartDate(start);
                $input.data('daterangepicker').setEndDate(end);
                break;
            case '7days':
                $input.daterangepicker({
                    singleDatePicker: false,
                    showDropdowns: true,
                    autoUpdateInput: true,
                    locale: { format: 'DD/MM/YYYY' }
                });

                start = moment().subtract(6, 'days');
                end = moment();

                $input.data('daterangepicker').setStartDate(start);
                $input.data('daterangepicker').setEndDate(end);
                break;
            case 'date':
                $inputWrapper.removeClass('d-none');

                $input.daterangepicker({
                    singleDatePicker: false,
                    showDropdowns: true,
                    autoUpdateInput: true,
                    locale: { format: 'DD/MM/YYYY' }
                });
                break;
            case 'month':
                $inputWrapper.removeClass('d-none');

                let nowMonth = new Date();
                let currentMonth = ("0" + (nowMonth.getMonth() + 1)).slice(-2);
                let currentYear = nowMonth.getFullYear();
                let currentMonthYear = currentMonth + "/" + currentYear;

                $input.datepicker({
                    format: "mm/yyyy",
                    startView: "months",
                    minViewMode: "months",
                    autoclose: true,
                    orientation: "bottom"
                });

                $input.datepicker('update', currentMonthYear);
                break;
            case 'year':
                $inputWrapper.removeClass('d-none');

                let nowYear = new Date();
                let year = nowYear.getFullYear();

                $input.datepicker({
                    format: "yyyy",
                    startView: "years",
                    minViewMode: "years",
                    autoclose: true,
                    orientation: "bottom"
                });

                $input.datepicker('update', year.toString());
                break;
        }
    });

});


$(document).ready(function () {
    let $inputWrapper = $('#daterange_2').closest('.form-group');
    let $input = $('#daterange_2');

    $inputWrapper.addClass('d-none');

    $('#time_filter_2').on('change', function () {
        let type = $(this).val();
        $inputWrapper.addClass('d-none');
        if ($input.data('daterangepicker')) {
            $input.data('daterangepicker').remove();
        }
        if ($input.data('datepicker')) {
            $input.datepicker('destroy');
        }

        $input.val('');

        let start, end;

        switch (type) {
            case 'today':
                $input.daterangepicker({
                    singleDatePicker: false,
                    showDropdowns: true,
                    autoUpdateInput: true,
                    locale: { format: 'DD/MM/YYYY' }
                });

                start = moment();
                end = moment();

                $input.data('daterangepicker').setStartDate(start);
                $input.data('daterangepicker').setEndDate(end);
                break;
            case '7days':
                $input.daterangepicker({
                    singleDatePicker: false,
                    showDropdowns: true,
                    autoUpdateInput: true,
                    locale: { format: 'DD/MM/YYYY' }
                });

                start = moment().subtract(6, 'days');
                end = moment();

                $input.data('daterangepicker').setStartDate(start);
                $input.data('daterangepicker').setEndDate(end);
                break;
            case 'date':
                $inputWrapper.removeClass('d-none');

                $input.daterangepicker({
                    singleDatePicker: false,
                    showDropdowns: true,
                    autoUpdateInput: true,
                    locale: { format: 'DD/MM/YYYY' }
                });
                break;
            case 'month':
                $inputWrapper.removeClass('d-none');

                let nowMonth = new Date();
                let currentMonth = ("0" + (nowMonth.getMonth() + 1)).slice(-2);
                let currentYear = nowMonth.getFullYear();
                let currentMonthYear = currentMonth + "/" + currentYear;

                $input.datepicker({
                    format: "mm/yyyy",
                    startView: "months",
                    minViewMode: "months",
                    autoclose: true,
                    orientation: "bottom"
                });

                $input.datepicker('update', currentMonthYear);
                break;
            case 'year':
                $inputWrapper.removeClass('d-none');

                let nowYear = new Date();
                let year = nowYear.getFullYear();

                $input.datepicker({
                    format: "yyyy",
                    startView: "years",
                    minViewMode: "years",
                    autoclose: true,
                    orientation: "bottom"
                });

                $input.datepicker('update', year.toString());
                break;
        }
    });

});


"use strict";
const COLORS = {
    primary: '#6993FF',
    success: '#1BC5BD',
    info: '#8950FC',
    warning: '#FFA800',
    danger: '#F64E60'
};

let columnChart;
const renderColumnChart = (categories = [], values = []) => {
    const options = {
        series: [
            { name: '', data: values } // chỉ 1 series
        ],
        chart: { type: 'bar', height: 500 },
        title: {
            text: '',
            align: 'center',
            style: { fontSize: '16px', fontWeight: 'bold' }
        },
        plotOptions: {
            bar: { horizontal: false, columnWidth: '50%', endingShape: 'flat' }
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ['transparent'] },
        xaxis: { categories: categories },
        yaxis: {
            title: { text: 'Doanh thu (VNĐ)', style: { fontSize: '12px', fontWeight: 'normal' } }
        },
        fill: { opacity: 1 },
        tooltip: { y: { formatter: val => val } },
        colors: [COLORS.primary],
        legend: { show: false }
    };

    if (columnChart) {
        columnChart.destroy();
    }

    columnChart = new ApexCharts(document.querySelector("#chart_3_overview"), options);
    columnChart.render();
};

let lineChart;

const renderLineChart = (categories = [], values = []) => {
    const options = {
        series: [{
            name: "Người dùng mới",
            data: values
        }],
        chart: {
            height: 500,
            type: 'line',
            zoom: { enabled: false }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'straight' },
        grid: {
            row: { colors: ['#f3f3f3', 'transparent'], opacity: 0.5 }
        },
        xaxis: { categories: categories },
        colors: [COLORS.primary],
        title: {
            text: 'Thống kê người dùng mới',
            align: 'center',
            style: { fontSize: '16px', fontWeight: 'bold' }
        },
        tooltip: {
            y: { formatter: val => val }
        },
        legend: {
            position: 'bottom',
            horizontalAlign: 'center',
            fontSize: '12px',
            markers: { width: 12, height: 12 },
            itemMargin: { horizontal: 10, vertical: 5 }
        }
    };

    if (lineChart) {
        lineChart.destroy();
    }

    lineChart = new ApexCharts(document.querySelector("#chart_1_overview"), options);
    lineChart.render();
};

function getSelectedDates(filterType) {
    const $input = $('#daterange_1');
    let obj;
     
    if (filterType === 'today') {
        obj = {
            startDate: moment().format('YYYY-MM-DD'),
            endDate: moment().format('YYYY-MM-DD'),
            type: 'daily'
        };
    }

    if (filterType === '7days') {
        obj = {
            startDate: moment().subtract(6, 'days').format('YYYY-MM-DD'),
            endDate: moment().format('YYYY-MM-DD'),
            type: 'daily'
        };
    }

    if (filterType === 'date' && $input.data('daterangepicker')) {
        obj= {
            startDate: $input.data('daterangepicker').startDate.format('YYYY-MM-DD'),
            endDate: $input.data('daterangepicker').endDate.format('YYYY-MM-DD'),
            type: 'daily'
        };
    }

    if (filterType === 'month') {
        const val = $input.val();
        if (val) {
            const [m, y] = val.split('/');
            const startDate = `${y}-${m}-01`;
            obj = {
                startDate: startDate,
                endDate: moment(startDate).endOf('month').format('YYYY-MM-DD'),
                type: 'daily'
            };
        }
    }

    if (filterType === 'year') {
        const y = $input.val();
        if (y) {
            obj = {
                year: y,
                type: 'monthly'
            };
        }
    }

    return obj;
}

function getSelectedDates2(filterType) {
    const $input = $('#daterange_2');
    let obj;
     
    if (filterType === 'today') {
        obj = {
            startDate: moment().format('YYYY-MM-DD'),
            endDate: moment().format('YYYY-MM-DD'),
            type: 'daily'
        };
    }

    if (filterType === '7days') {
        obj = {
            startDate: moment().subtract(6, 'days').format('YYYY-MM-DD'),
            endDate: moment().format('YYYY-MM-DD'),
            type: 'daily'
        };
    }

    if (filterType === 'date' && $input.data('daterangepicker')) {
        obj= {
            startDate: $input.data('daterangepicker').startDate.format('YYYY-MM-DD'),
            endDate: $input.data('daterangepicker').endDate.format('YYYY-MM-DD'),
            type: 'daily'
        };
    }

    if (filterType === 'month') {
        const val = $input.val();
        if (val) {
            const [m, y] = val.split('/');
            const startDate = `${y}-${m}-01`;
            obj = {
                startDate: startDate,
                endDate: moment(startDate).endOf('month').format('YYYY-MM-DD'),
                type: 'daily'
            };
        }
    }

    if (filterType === 'year') {
        const y = $input.val();
        if (y) {
            obj = {
                year: y,
                type: 'monthly'
            };
        }
    }

    return obj;
}

function loadRevenueReport(filterType) {
    const dates = getSelectedDates(filterType);
    const requestData = dates;

    $.ajax({
        url: '/api/payment/get-statistical',
        method: 'POST',
        contentType: 'application/json',
        headers: { 'Authorization': sessionStorage.getItem('token') },
        data: JSON.stringify(requestData),
        success: function(res) {
            if (res && res.data) {
                $('#total_revenue').html(`
                    <p class="text-danger" style="font-size: 18px;font-weight: 700;">Tổng doanh thu: ${Math.trunc(res.data.total ?? 0).toLocaleString('en-US')} VNĐ</p>
                `);

                let labels = [];
                let values = [];

                if (res.data.daily) {
                    const daily = res.data.daily;
                    labels = daily.map(item => moment(item.day).format('DD/MM/YYYY'));
                    values = daily.map(item => parseFloat(item.revenue));
                } else if (res.data.monthly) {
                    const monthly = res.data.monthly;
                    labels = monthly.map(item => moment(item.month, 'YYYY-MM').format('MM/YYYY'));
                    values = monthly.map(item => parseFloat(item.revenue));
                } else {
                    console.error('Không có dữ liệu daily hoặc monthly:', res);
                    return;
                }

                renderColumnChart(labels, values);
            } else {
                console.error('Invalid response format:', res);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error calling API:', {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText,
                error: error
            });
        }
    });
}

function loadNewUser(filterType) {
    const dates = getSelectedDates2(filterType);
    const requestData = dates;

    $.ajax({
        url: '/api/user/get-statistical',
        method: 'POST',
        contentType: 'application/json',
        headers: { 'Authorization': sessionStorage.getItem('token') },
        data: JSON.stringify(requestData),
        success: function(res) {
            if (res && res.data) {
                $('#total_new_user').html(`
                    <p class="text-danger" style="font-size: 18px;font-weight: 700;">Tổng lượt đăng ký mới: ${res.data.total ?? 0}</p>
                `);

                let labels = [];
                let values = [];

                if (res.data.daily) {
                    const daily = res.data.daily;
                    labels = daily.map(item => moment(item.day).format('DD/MM/YYYY'));
                    values = daily.map(item => parseFloat(item.new_users));
                } else if (res.data.monthly) {
                    const monthly = res.data.monthly;
                    labels = monthly.map(item => moment(item.month, 'YYYY-MM').format('MM/YYYY'));
                    values = monthly.map(item => parseFloat(item.new_users));
                } else {
                    console.error('Không có dữ liệu daily hoặc monthly:', res);
                    return;
                }

                renderLineChart(labels, values);
            } else {
                console.error('Invalid response format:', res);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error calling API:', {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText,
                error: error
            });
        }
    });
}

$(document).ready(function () {
    const selectedValue = $('#time_filter').val();
    const selectedValue2 = $('#time_filter_2').val();

    loadRevenueReport(selectedValue);
    loadNewUser(selectedValue2);

    $('#kt_search_1').on('click', function(e) {
        e.preventDefault();
        const selectedValue = $('#time_filter').val();
        loadRevenueReport(selectedValue);
    });

    $('#kt_search_2').on('click', function(e) {
        e.preventDefault();
        const selectedValue2 = $('#time_filter_2').val();
        loadNewUser(selectedValue2);
    });

    $('#kt_reset_1').on('click', function(e) {
        e.preventDefault();
        $('#time_filter').val('today').trigger('change');
        loadRevenueReport('today');
    });

    $('#kt_reset_2').on('click', function(e) {
        e.preventDefault();
        $('#time_filter_2').val('today').trigger('change');
        loadNewUser('today');
    });
});






