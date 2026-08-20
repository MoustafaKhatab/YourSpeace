const addressService = require('../services/address.service');

const createAddress = async (req, res) => {
    try {
        const { user_id } = req.user;

        const { address_line1, address_line2, city, state, country, postal_code } = req.body;
        if (!address_line1 || !city || !state || !country || !postal_code) {
            return res.status(400).json({ message: 'address_line1, city, state, country, and postal_code are required' });
        }

        const address = await addressService.createAddress(
            user_id,
            address_line1,
            address_line2 || null,
            city,
            state,
            country,
            postal_code
        );

        if (!address) {
            return res.status(400).json({ message: 'Failed to create address' });
        }

        return res.status(201).json({ message: 'Address created successfully', address });
    } catch (error) {
        console.error('Create address error:', error.message);
        return res.status(500).json({ message: 'Failed to create address' });
    }
};

const getAddressByUserId = async (req, res) => {
    try {
        const { user_id } = req.user;

        const addresses = await addressService.getAddressByUserId(user_id);
        return res.status(200).json({
            message: 'Addresses fetched successfully',
            addresses,
        });
    } catch (error) {
        console.error('Error fetching address:', error.message);
        return res.status(500).json({ message: 'Failed to fetch address' });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const { address_id } = req.params;
        const { user_id } = req.user;

        if (!address_id) {
            return res.status(400).json({ message: 'Address ID is required' });
        }

        const address = await addressService.deleteAddress(user_id, address_id);
        return res.status(200).json({ message: 'Address deleted successfully', address });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: error.message });
        }

        console.error('Delete address error:', error.message);
        return res.status(500).json({ message: 'Failed to delete address' });
    }
};

const updateAddress = async (req, res) =>{
    try {
        
        const { address_id } = req.params;
        const { user_id } = req.user;
        const { address_line1, address_line2, city, state, country, postal_code } = req.body;
        if(!address_line1 || !city || !state || !country || !postal_code) {
            return res.status(400).json({ message: 'address_line1, city, state, country, and postal_code are required' });
        }

        if(!address_id) {
            return res.status(400).json({ message: 'Address ID is required' });
        }

        const address = await addressService.updateAddressByAddressIdAndUserId(user_id, address_id, address_line1, address_line2 || null, city, state, country, postal_code);
        return res.status(200).json({ message: 'Address updated successfully', address });

    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: error.message });
        }

        console.error('Update address error:', error.message);
        return res.status(500).json({ message: 'Failed to update address' });
    }
};

module.exports = {
    createAddress,
    getAddressByUserId,
    deleteAddress,
    updateAddress
};
