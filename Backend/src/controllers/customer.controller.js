const customerService = require('../services/customer.service');

const updateCustomer = async (req, res) => {
    try {
        const { user_id } = req.user;

        if (req.body.email !== undefined) {
            return res.status(400).json({
                message: 'Email cannot be updated here; use the email verification flow later',
            });
        }

        const { first_name, last_name, phone_number } = req.body;
        if (!first_name || !last_name || !phone_number) {
            return res.status(400).json({
                message: 'First name, last name, and phone number are required',
            });
        }

        const customer = await customerService.updateCustomer(
            user_id,
            first_name,
            last_name,
            phone_number
        );
        return res.status(200).json({ message: 'Customer updated successfully', customer });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    updateCustomer,
};
