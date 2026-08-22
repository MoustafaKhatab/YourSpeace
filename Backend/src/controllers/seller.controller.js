const sellerService = require('../services/seller.service');

const getSellerProfile = async (req, res) => {
    try {
        const { user_id } = req.user;
        const profile = await sellerService.getSellerProfile(user_id);
        return res.status(200).json({
            message: 'Seller profile fetched successfully',
            ...profile,
        });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: error.message });
        }

        console.error('Get seller profile error:', error.message);
        return res.status(500).json({ message: 'Failed to fetch seller profile' });
    }
};

module.exports = {
    getSellerProfile,
};
