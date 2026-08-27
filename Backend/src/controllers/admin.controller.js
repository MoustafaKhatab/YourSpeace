const adminService = require('../services/admin.service');

const createAdmin = async (req, res) => {
    try {
        const adminCount = await adminService.countAdmins();
        const isBootstrap = adminCount === 0;

        if (!isBootstrap) {
            if (!req.user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            if (req.user.role !== 'ADMIN' || !req.user.admin_id) {
                return res.status(403).json({ message: 'Forbidden: requires ADMIN role' });
            }
        }

        const { email, password, first_name, last_name, phone_number } = req.body || {};

        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({
                message: 'email, password, first_name, and last_name are required',
            });
        }

        if (String(password).length < 8) {
            return res.status(400).json({ message: 'password must be at least 8 characters' });
        }

        const result = await adminService.createAdmin(
            String(email).trim().toLowerCase(),
            String(password),
            String(first_name).trim(),
            String(last_name).trim(),
            phone_number !== undefined && phone_number !== null && String(phone_number).trim() !== ''
                ? String(phone_number).trim()
                : null
        );

        return res.status(201).json({
            message: isBootstrap
                ? 'First admin created successfully'
                : 'Admin created successfully',
            ...result,
        });
    } catch (error) {
        if (error.statusCode === 400 || error.statusCode === 409) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error('Create admin error:', error.message);
        return res.status(500).json({ message: 'Failed to create admin' });
    }
};

const getAdminProfile = async (req, res) => {
    try {
        const { user_id } = req.user;
        const profile = await adminService.getAdminProfile(user_id);
        return res.status(200).json({
            message: 'Admin profile fetched successfully',
            ...profile,
        });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: error.message });
        }
        console.error('Get admin profile error:', error.message);
        return res.status(500).json({ message: 'Failed to fetch admin profile' });
    }
};

const updateAdmin = async (req, res) => {
    try {
        const { user_id } = req.user;

        if (req.body?.email !== undefined) {
            return res.status(400).json({
                message: 'Email cannot be updated here; use the email verification flow later',
            });
        }

        const { first_name, last_name, phone_number } = req.body || {};
        if (!first_name || !last_name || !phone_number) {
            return res.status(400).json({
                message: 'First name, last name, and phone number are required',
            });
        }

        const admin = await adminService.updateAdmin(
            user_id,
            String(first_name).trim(),
            String(last_name).trim(),
            String(phone_number).trim()
        );
        return res.status(200).json({ message: 'Admin updated successfully', admin });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: error.message });
        }
        console.error('Update admin error:', error.message);
        return res.status(500).json({ message: 'Failed to update admin' });
    }
};

module.exports = {
    createAdmin,
    getAdminProfile,
    updateAdmin,
};
