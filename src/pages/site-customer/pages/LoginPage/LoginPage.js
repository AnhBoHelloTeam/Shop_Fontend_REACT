import React, { useState, useEffect, useCallback } from "react";
import { Button, Container, Form } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { SCREEN_URL } from "../../../../constants/screen/PathScreen";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../../../../store/user/userSlice";
import { getCurrent } from "../../../../store/user/asynsActions";
import Swal from "sweetalert2";
import { validate } from "../../../../utils/helpers";
import { loginAPI, regisAPI } from "../../../../api/authAPI";
import axios from "axios";

const LoginPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoggedIn } = useSelector((state) => state.user);

    // State
    const [isRegister, setIsRegister] = useState(false);
    const [payload, setPayload] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        address: "",
    });
    const [error, setError] = useState("");
    const [invalidFields, setInvalidFields] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Kiểm tra trạng thái isLoggedIn và chuyển hướng nếu đã đăng nhập
    useEffect(() => {
        if (isLoggedIn) {
            dispatch(getCurrent());
            navigate(SCREEN_URL.HOME);
        }
    }, [isLoggedIn, dispatch, navigate]);

    // Đặt lại payload khi chuyển giữa đăng nhập và đăng ký
    useEffect(() => {
        setPayload({
            name: "",
            email: "",
            password: "",
            phone: "",
            address: "",
        });
        setError("");
        setInvalidFields([]);
    }, [isRegister]);

    // Xử lý thay đổi input
    const handleInputChange = useCallback((e, key) => {
        setPayload((prev) => ({ ...prev, [key]: e.target.value }));
        setError("");
        setInvalidFields((prev) => prev.filter(item => item.name !== key)); // Chỉ xóa lỗi của trường đang nhập
    }, []);

    // Xử lý submit form
    const handleSubmit = useCallback(async () => {
        if (isSubmitting) return; // Tránh submit nhiều lần
        
        setIsSubmitting(true);
        try {
            // Tạo dữ liệu cần thiết dựa vào trạng thái đăng nhập hay đăng ký
            const dataToValidate = isRegister 
                ? payload 
                : { email: payload.email, password: payload.password };
            
            const inValids = validate(dataToValidate, setInvalidFields);

            if (inValids === 0) {
                if (isRegister) {
                    const response = await regisAPI(payload);
                    if (response && response.user) {
                        Swal.fire(
                            "Đăng ký thành công!",
                            "Vui lòng đăng nhập để tiếp tục.",
                            "success"
                        ).then(() => {
                            setIsRegister(false);
                        });
                    } else {
                        throw new Error(response?.message || "Đăng ký thất bại!");
                    }
                } else {
                    const response = await loginAPI(payload.email, payload.password);
                    if (response && response.user) {
                        Swal.fire(
                            "Đăng nhập thành công!",
                            `Chào mừng ${response.user.name || "bạn"}!`,
                            "success"
                        ).then(() => {
                            dispatch(
                                login({
                                    isLoggedIn: true,
                                    token: response.token,
                                    userData: response.user,
                                })
                            );
                            navigate(SCREEN_URL.HOME);
                        });
                    } else {
                        throw new Error("Thông tin đăng nhập không đúng!");
                    }
                }
            }
        } catch (error) {
            let errorMessage = "Đã xảy ra lỗi. Vui lòng thử lại sau.";
            
            // Xử lý lỗi Axios
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    // Lỗi HTTP từ server (400, 401, 500...)
                    const responseData = error.response.data;
                    errorMessage = responseData.message || 
                                  responseData.error || 
                                  `Lỗi ${error.response.status}: ${error.response.statusText}`;
                    
                    // Xử lý riêng cho lỗi 400
                    if (error.response.status === 400) {
                        if (responseData.errors && Array.isArray(responseData.errors)) {
                            // Nếu server trả về danh sách lỗi cho từng trường
                            const fieldErrors = responseData.errors.map(err => ({
                                name: err.field,
                                message: err.message
                            }));
                            setInvalidFields(fieldErrors);
                        }
                        errorMessage = responseData.message || "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
                    }
                } else if (error.request) {
                    // Không nhận được phản hồi từ server
                    errorMessage = "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
                }
            } else if (error.message) {
                // Lỗi không phải từ Axios
                errorMessage = error.message;
            }
            
            setError(errorMessage);
            Swal.fire("Lỗi!", errorMessage, "error");
        } finally {
            setIsSubmitting(false);
        }
    }, [payload, isRegister, dispatch, navigate, isSubmitting]);

    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <Container bsPrefix="col-5">
                <h2 className="text-center mb-4">{isRegister ? "Đăng ký" : "Đăng nhập"}</h2>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}>
                    {isRegister && (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Label>Họ và tên</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={payload.name}
                                    onChange={(e) => handleInputChange(e, "name")}
                                    isInvalid={invalidFields.some((el) => el.name === "name")}
                                    placeholder="Nhập họ và tên"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {invalidFields.find((el) => el.name === "name")?.message}
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Số điện thoại</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={payload.phone}
                                    onChange={(e) => handleInputChange(e, "phone")}
                                    isInvalid={invalidFields.some((el) => el.name === "phone")}
                                    placeholder="Nhập số điện thoại"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {invalidFields.find((el) => el.name === "phone")?.message}
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Địa chỉ</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={payload.address}
                                    onChange={(e) => handleInputChange(e, "address")}
                                    isInvalid={invalidFields.some((el) => el.name === "address")}
                                    placeholder="Nhập địa chỉ"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {invalidFields.find((el) => el.name === "address")?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </>
                    )}

                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            value={payload.email}
                            onChange={(e) => handleInputChange(e, "email")}
                            isInvalid={invalidFields.some((el) => el.name === "email")}
                            placeholder="Nhập email"
                        />
                        <Form.Control.Feedback type="invalid">
                            {invalidFields.find((el) => el.name === "email")?.message}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Mật khẩu</Form.Label>
                        <Form.Control
                            type="password"
                            value={payload.password}
                            onChange={(e) => handleInputChange(e, "password")}
                            isInvalid={invalidFields.some((el) => el.name === "password")}
                            placeholder="Nhập mật khẩu"
                        />
                        <Form.Control.Feedback type="invalid">
                            {invalidFields.find((el) => el.name === "password")?.message}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <div className="d-flex justify-content-between mb-3">
                        {!isRegister && (
                            <Link to="#" className="text-primary">
                                Quên tài khoản?
                            </Link>
                        )}
                        <span
                            className="text-primary"
                            onClick={() => setIsRegister(!isRegister)}
                            style={{ cursor: "pointer" }}
                        >
                            {isRegister ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}
                        </span>
                    </div>

                    {error && <div className="text-danger mb-3">{error}</div>}

                    <Button 
                        variant="primary" 
                        type="submit" 
                        className="w-100"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Đang xử lý...' : (isRegister ? "Đăng ký" : "Đăng nhập")}
                    </Button>

                    <div className="text-center mt-3">
                        <Link to={SCREEN_URL.HOME} className="text-primary">
                            Về trang chủ?
                        </Link>
                    </div>
                </Form>
            </Container>
        </div>
    );
};

export default LoginPage;