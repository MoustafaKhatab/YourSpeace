const addressRepository = require('../rep/address.repository');

const createAddress = async (user_id, address_line1, address_line2, city, state, country, postal_code) => {
    return addressRepository.createAddress(
        user_id,
        address_line1,
        address_line2,
        city,
        state,
        country,
        postal_code
    );
};

const getAddressByUserId = async (user_id) => {
    return addressRepository.getAddressByUserId(user_id);
};

const deleteAddress = async (user_id, address_id) => {
    const deletedAddress = await addressRepository.deleteAddress(user_id, address_id);
    if (!deletedAddress) {
        const error = new Error('Address not found');
        error.statusCode = 404;
        throw error;
    }
    return deletedAddress;
};

const updateAddressByAddressIdAndUserId = async (user_id, address_id, address_line1, address_line2, city, state, country, postal_code) => {
    
    const updatedAddress = await addressRepository.updateAddressByAddressIdAndUserId(user_id, address_id, address_line1, address_line2, city, state, country, postal_code);

    if (!updatedAddress) {
        const error = new Error('Address not found');
        error.statusCode = 404;
        throw error;
    }
    return updatedAddress;
};
module.exports = {
    createAddress,
    getAddressByUserId,
    deleteAddress,
    updateAddressByAddressIdAndUserId
};
