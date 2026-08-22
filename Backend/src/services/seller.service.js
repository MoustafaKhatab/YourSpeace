const authRepository = require('../rep/auth.repository');

const getSellerProfile = async (user_id) => {
    const row = await authRepository.getUserById(user_id, 'SELLER');
    if (!row) {
        const error = new Error('Seller profile not found');
        error.statusCode = 404;
        throw error;
    }

    return {
        user: {
            user_id: row.user_id,
            email: row.email,
            first_name: row.first_name,
            last_name: row.last_name,
            phone_number: row.phone_number,
            role: row.role,
        },
        seller: {
            seller_id: row.seller_id,
            created_at: row.seller_created_at,
            updated_at: row.seller_updated_at,
        },
    };
};

module.exports = {
    getSellerProfile,
};
