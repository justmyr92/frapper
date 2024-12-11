import { faClose, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, useEffect } from "react";
import { getCampusesByExtension } from "../services/service"; // Add getUserById to fetch user data
import Swal from "sweetalert2";

const UpdateUserModal = ({ userId, setIsUpdateModalOpen, setReload }) => {
    const [campuses, setCampuses] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        campus_id: "",
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const getCampuses = async () => {
            const response = await getCampusesByExtension(false);
            setCampuses(response);
        };
        const getUserDetails = async () => {
            try {
                const response = await fetch(
                    `https://ai-backend-drcx.onrender.com/api/sd-office/${userId}`
                );
                const data = await response.json(); // Convert to JSON
                setFormData({
                    name: data.name,
                    email: data.email,
                    password: "", // Leave password blank for security purposes
                    campus_id: data.campus_id,
                });
            } catch (error) {
                console.error("Error fetching user details:", error);
            }
        };

        getCampuses();
        getUserDetails();
    }, [userId]);

    const validateForm = () => {
        const { name, email, password, campus_id } = formData;
        let errors = {};
        let isValid = true;

        if (!name) {
            errors.name = "Name is required.";
            isValid = false;
        }

        if (!email) {
            errors.email = "Email is required.";
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.email = "Email address is invalid.";
            isValid = false;
        }

        // Password validation (optional for update)
        if (password && password.length < 6) {
            errors.password = "Password must be at least 6 characters.";
            isValid = false;
        } else if (
            password &&
            !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}/.test(password)
        ) {
            errors.password =
                "Password must include at least one lowercase letter, one uppercase letter, and one number.";
            isValid = false;
        }

        if (!campus_id) {
            errors.campus_id = "Campus is required.";
            isValid = false;
        }

        setErrors(errors);
        return isValid;
    };

    const handleClose = () => {
        setFormData({
            name: "",
            email: "",
            password: "",
            campus_id: "",
        });
        setErrors({});
        setIsUpdateModalOpen(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: "",
            });
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            // Show confirmation dialog
            const confirmResult = await Swal.fire({
                title: "Are you sure?",
                text: "Do you want to save the changes?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, save it!",
                cancelButtonText: "No, cancel!",
            });

            if (!confirmResult.isConfirmed) {
                return; // User canceled the operation
            }

            // Show loading spinner
            Swal.fire({
                title: "Updating...",
                text: "Please wait while we update the user information.",
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                willOpen: () => {
                    Swal.showLoading();
                },
            });

            // Make API call to update SD Office user
            const response = await fetch(
                `https://ai-backend-drcx.onrender.com/api/update/sd-office/${userId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                }
            );

            if (response.ok) {
                // Close loading spinner
                Swal.close();

                // Show success message
                await Swal.fire({
                    title: "Success!",
                    text: "User information has been updated successfully.",
                    icon: "success",
                });

                setReload(true); // Refresh data after update
                handleClose(); // Close the modal and reset form data
            } else {
                throw new Error("Failed to update user information.");
            }
        } catch (error) {
            console.error("Error updating user:", error);

            // Close loading spinner
            Swal.close();

            // Show error message
            Swal.fire({
                title: "Error",
                text: "An error occurred while updating the user information. Please try again.",
                icon: "error",
            });
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div
            id="static-modal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50"
        >
            <div className="relative w-full max-w-xl bg-white rounded-lg shadow-lg">
                <div className="flex items-center justify-between p-4 border-b rounded-t">
                    <h3 className="text-xl font-semibold text-gray-900">
                        Update User
                    </h3>
                    <button
                        type="button"
                        className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 inline-flex justify-center items-center"
                        onClick={handleClose}
                    >
                        <FontAwesomeIcon icon={faClose} size="xl" />
                        <span className="sr-only">Close modal</span>
                    </button>
                </div>
                <div className="p-4 space-y-4">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label
                                className="block text-gray-700 text-sm font-bold mb-2"
                                htmlFor="name"
                            >
                                Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                className="form__input border mb-2 mt-1 block w-full px-3 py-4 rounded-md shadow-sm sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter name"
                            />
                            {errors.name && (
                                <p className="text-red-500 text-sm">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                        <div className="mb-4">
                            <label
                                className="block text-gray-700 text-sm font-bold mb-2"
                                htmlFor="email"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="form__input border mb-2 mt-1 block w-full px-3 py-4 rounded-md shadow-sm sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter email"
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm">
                                    {errors.email}
                                </p>
                            )}
                        </div>
                        <div className="mb-4">
                            <label
                                className="block text-gray-700 text-sm font-bold mb-2"
                                htmlFor="password"
                            >
                                Password (optional)
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="form__input border mb-2 mt-1 block w-full px-3 py-4 rounded-md shadow-sm sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter new password (if changing)"
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                                >
                                    <FontAwesomeIcon
                                        icon={showPassword ? faEyeSlash : faEye}
                                        className="text-gray-400"
                                    />
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-500 text-sm">
                                    {errors.password}
                                </p>
                            )}
                        </div>
                        <div className="mb-4">
                            <label
                                className="block text-gray-700 text-sm font-bold mb-2"
                                htmlFor="campus_id"
                            >
                                Campus
                            </label>
                            <select
                                id="campus_id"
                                name="campus_id"
                                value={formData.campus_id}
                                onChange={handleChange}
                                className="form__input border mb-2 mt-1 block w-full px-3 py-4 rounded-md shadow-sm sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select campus</option>
                                {campuses.map((campus) => (
                                    <option
                                        key={campus.campus_id}
                                        value={campus.campus_id}
                                    >
                                        {campus.name}
                                    </option>
                                ))}
                            </select>
                            {errors.campus_id && (
                                <p className="text-red-500 text-sm">
                                    {errors.campus_id}
                                </p>
                            )}
                        </div>
                    </form>
                </div>
                <div className="flex items-center justify-end p-4 border-t border-gray-200 rounded-b gap-2">
                    <button
                        type="button"
                        className="py-2.5 px-5 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-gray-100"
                        onClick={handleClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5"
                        onClick={handleSubmit}
                    >
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateUserModal;
