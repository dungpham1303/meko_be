import VNPayService from "./service/vnpay.service.js";
import ResponseUtil from "../../utils/response_utils.js";
import PaymentService from "./service/payment.service.js";
// thanh toán vnpay create url
const createPayment = async (req, res) => {
    try {
        const { amount, userId } = req.body;
        const ipAddr =
                    req.headers["x-forwarded-for"] ||
                    req.connection.remoteAddress ||
                    req.socket.remoteAddress;
        const paymentUrl = await VNPayService.createPayment(amount, userId,ipAddr);
        return ResponseUtil.successResponse(res, paymentUrl);
    } catch (error) {
        if(error.message === "User not found"){
            return ResponseUtil.notFoundResponse(res, 'Người dùng không tồn tại');
        }
        console.error(error);
        return ResponseUtil.serverErrorResponse(res, error.message);
    }
};

// trạng thái thành toán redirect ra html status transaction
const vnp_ReturnUrl = async (req, res) => {
    const { backUrl, deeplink } = req.query;
    const returnHref = deeplink || backUrl || "/";
    try {
        await VNPayService.vnp_ReturnUrl(req.query);
        const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Thanh toán thành công</title>
  <style>
    :root { --green:#16a34a; --green-700:#15803d; --red:#dc2626; --gray:#111827; --muted:#6b7280; --bg:#f9fafb; --white:#ffffff; }
    *{box-sizing:border-box} body{margin:0;background:var(--bg);font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:var(--gray)}
    .container{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{width:100%;max-width:520px;background:var(--white);border-radius:16px;box-shadow:0 10px 20px rgba(0,0,0,.06);padding:28px;text-align:center}
    .icon{width:64px;height:64px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin:0 auto 16px auto}
    .icon.success{background:rgba(22,163,74,.1);color:var(--green);font-size:48px}
    .icon.fail{background:rgba(220,38,38,.1);color:var(--red);font-size:48px }
    h1{font-size:22px;margin:8px 0 6px}
    p{margin:0;color:var(--muted)}
    .actions{margin-top:20px}
    .btn{display:inline-block;padding:12px 18px;border-radius:10px;text-decoration:none;color:#fff;background:var(--green);font-weight:600}
    .btn:hover{background:var(--green-700)}
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="icon success">✓</div>
      <h1>Thanh toán thành công</h1>
      <p>Bạn có thể quay lại để tiếp tục sử dụng ứng dụng.</p>
      <div class="actions">
        <a class="btn" href="${returnHref}">Quay trở lại</a>
      </div>
    </div>
  </div>
</body>
</html>`;
        return res.status(200).set("Content-Type", "text/html; charset=utf-8").send(html);
    } catch (error) {
        const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Thanh toán thất bại</title>
  <style>
    :root { --red:#dc2626; --red-700:#b91c1c; --gray:#111827; --muted:#6b7280; --bg:#f9fafb; --white:#ffffff; }
    *{box-sizing:border-box} body{margin:0;background:var(--bg);font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:var(--gray)}
    .container{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{width:100%;max-width:520px;background:var(--white);border-radius:16px;box-shadow:0 10px 20px rgba(0,0,0,.06);padding:28px;text-align:center}
    .icon{width:64px;height:64px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin:0 auto 16px auto}
    .icon.fail{background:rgba(220,38,38,.1);color:var(--red)}
    h1{font-size:22px;margin:8px 0 6px}
    p{margin:0;color:var(--muted)}
    .actions{margin-top:20px}
    .btn{display:inline-block;padding:12px 18px;border-radius:10px;text-decoration:none;color:#fff;background:var(--red);font-weight:600}
    .btn:hover{background:var(--red-700)}
    .err{margin-top:10px;color:var(--muted);font-size:14px;word-break:break-word}
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="icon fail">✕</div>
      <h1>Thanh toán thất bại</h1>
      <p>Vui lòng thử lại hoặc liên hệ hỗ trợ.</p>
      <div class="actions">
        <a class="btn" href="${returnHref}">Quay trở lại</a>
      </div>
      <div class="err">${error && error.message ? error.message : ''}</div>
    </div>
  </div>
</body>
</html>`;
        return res.status(400).set("Content-Type", "text/html; charset=utf-8").send(html);
    }
};

// user mua gói
const createPaymentPacakge=async(req,res)=>{
    try {

        const paymentPackage=await PaymentService.createPayment(req.body);
        const result=await PaymentService.getPayment(paymentPackage.insertId);
        
        return ResponseUtil.successResponse(res,result,'Mua gói thành công');
    } catch (error) {
        if(error.message.includes('User Not Found')){
            return ResponseUtil.notFoundResponse(res,'Người dùng không tồn tại');
        }
        if(error.message.includes('Package Not Found')){
            return ResponseUtil.notFoundResponse(res,'Gói không tồn tại');
        }
        if(error.message.includes('Not enough balance')){
            return ResponseUtil.validationErrorResponse(res,'Số dư trong ví không đủ');
        }
        if(error.message.includes('Amount not match')){
            return ResponseUtil.validationErrorResponse(res,'Số tiền không khớp với gói');
        }
        if(error.message.includes('Pin wallet not valid')){
            return ResponseUtil.validationErrorResponse(res,'Mã pin không hợp lệ');
        }
        if(error.message.includes('You have not wallet')){
            return ResponseUtil.validationErrorResponse(res,'Bạn chưa có ví thanh toán');
        }
        console.log(error.message);
        return ResponseUtil.errorResponse(res,error.message);
    }
}


//lấy ra danh sách gói user đã mua(đang sở hữu)
const getPaymentsByUserId=async(req,res)=>{
  try{
    const userId=req.query.userId;
    const result=await PaymentService.getPaymentsByUserId(userId);
    return ResponseUtil.successResponse(res,result,'Thành công');

  }catch(error){
    if(error.message.includes('User Not Found')){
      return ResponseUtil.notFoundResponse(res,'Người dùng không tồn tại');
    }
    console.log(error.message);
    return ResponseUtil.errorResponse(res,error.message);
    
  }
}

const thongkeController = async (req, res) => {
  try {
    const { startDate, endDate, type, year } = req.body;

    // Validate type
    const allowType = ["daily", "monthly", "yearly"];
    if (!type || !allowType.includes(type)) {
      return ResponseUtil.validationErrorResponse(
        res,
        "type không hợp lệ. Hãy dùng: daily, monthly hoặc yearly"
      );
    }

    // Validate DAILY
    if (type === "daily") {
      if (!startDate || !endDate) {
        return ResponseUtil.validationErrorResponse(
          res,
          "startDate và endDate là bắt buộc cho daily!"
        );
      }

      if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
        return ResponseUtil.validationErrorResponse(
          res,
          "startDate hoặc endDate không hợp lệ!"
        );
      }
    }

    // Validate MONTHLY
    if (type === "monthly") {
      if (!year) {
        return ResponseUtil.validationErrorResponse(
          res,
          "year là bắt buộc cho monthly!"
        );
      }

      if (isNaN(year)) {
        return ResponseUtil.validationErrorResponse(
          res,
          "year phải là số!"
        );
      }
    }

    // YEARLY không cần validate gì thêm

    // Tính tổng doanh thu
    const total = await PaymentService.tongDoanhThu(startDate, endDate);

    let result;

    // DAILY
    if (type === "daily") {
      result = await PaymentService.doanhThuTheoNgay(startDate, endDate);
    }

    // MONTHLY
    if (type === "monthly") {
      result = await PaymentService.doanhThuTheoThang(year);
    }

   

    return ResponseUtil.successResponse(
      res,result,
      "Thống kê doanh thu"
    );
  } catch (error) {
    console.log(error.message);
    return ResponseUtil.errorResponse(res, error.message);
  }
};





export default {
    createPayment,
    vnp_ReturnUrl,
    createPaymentPacakge,
    getPaymentsByUserId,
    thongkeController
};

