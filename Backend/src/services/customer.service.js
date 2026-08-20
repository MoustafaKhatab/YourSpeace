const customerRepository = require('../rep/customer.repository');

const updateCustomer = async (user_id, first_name, last_name, phone_number) => {
    return await customerRepository.updateCustomer(
        user_id,
        first_name,
        last_name,
        phone_number
    );
};

module.exports = {
    updateCustomer,
};
