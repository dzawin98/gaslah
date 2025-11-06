const axios = require('axios');

async function testCustomerCreation() {
  try {
    console.log('Testing customer creation with known good ODP ID...');
    
    // First, get available ODPs
    const odpResponse = await axios.get('https://api.latansa.my.id/api/odps');
    console.log('Available ODPs:', odpResponse.data.data.length);
    
    // Get the first available ODP
    const firstODP = odpResponse.data.data[0];
    console.log('Using ODP:', firstODP.id, '-', firstODP.name);
    
    // Test customer data with known good ODP ID
    const testCustomer = {
      name: 'Test Customer Debug',
      phone: '081234567890',
      area: firstODP.area,
      package: 'Test Package',
      packagePrice: 100000,
      addonPrice: 0,
      discount: 0,
      odpId: firstODP.id, // Use the actual ODP ID from database
      billingType: 'prepaid',
      activePeriod: 1,
      activePeriodUnit: 'months',
      installationStatus: 'not_installed',
      serviceStatus: 'active',
      activeDate: '2025-01-20',
      expireDate: '2025-02-20',
      paymentDueDate: '2025-01-25',
      status: 'active',
      routerId: 1
    };
    
    console.log('\nTest customer data:');
    console.log('odpId:', testCustomer.odpId, 'Type:', typeof testCustomer.odpId);
    console.log('routerId:', testCustomer.routerId, 'Type:', typeof testCustomer.routerId);
    
    // Try to create the customer
    const response = await axios.post('https://api.latansa.my.id/api/customers', testCustomer);
    
    console.log('\n✅ Customer created successfully!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('\n❌ Error creating customer:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.response?.data?.error);
    console.error('Full error:', error.response?.data);
  }
}

testCustomerCreation();