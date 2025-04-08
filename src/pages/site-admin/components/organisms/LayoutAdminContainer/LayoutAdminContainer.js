import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HeaderAdmin from "../HeaderAdmin/HeaderAdmin";
import SidebarAdmin from "../SidebarAdmin/SidebarAdmin";
import "./style.css";
import { useDispatch, useSelector } from "react-redux";
import { getCurrent } from "../../../../../store/user/asynsActions";

const LayoutAdminContainer = ({ component: Component, isHeader, isSidebar, title }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoggedIn, current } = useSelector((state) => state.user);

    // Fetch current user data only if logged in
    useEffect(() => {
        if (isLoggedIn) {
            dispatch(getCurrent());
        }
    }, [dispatch, isLoggedIn]);

    // Check role and redirect accordingly after user data is fetched
    useEffect(() => {
        if (isLoggedIn && current) {
            if (current.role === "user") {
                // If user is not an admin, redirect to user-login page
                navigate("/user-login");
            } else if (current.role === "admin") {
                // If user is admin, navigate to admin dashboard
                navigate("/admin");
            } else {
                // Redirect to home or another default page if role is invalid
                navigate("/");
            }
        }
    }, [current, isLoggedIn, navigate]);

    // Loading state until user role is available
    if (!isLoggedIn || !current) return <div>Loading...</div>; // Add loading state until user data is available

    return (
        <>
            {isHeader && <HeaderAdmin />}
            {isSidebar ? (
                <div className="row">
                    <div className="col-2 bg-dark min-height-100vh">
                        <SidebarAdmin />
                    </div>
                    <div className="col-10 d-flex justify-content-center mt-3">
                        <Component />
                    </div>
                </div>
            ) : (
                <Component />
            )}
        </>
    );
};

export default LayoutAdminContainer;
