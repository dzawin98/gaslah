const axios = require('axios');

async function testODPAPI() {
  try {
    console.log('Testing ODP API endpoint...');
    
    // Test the API endpoint that the frontend uses
    const response = await axios.get('https://api.latansa.my.id/api/odps');
    
    console.log('API Response Status:', response.status);
    console.log('API Response Success:', response.data.success);
    
    if (response.data.success && response.data.data) {
      console.log('\n=== ODPs from API ===');
      console.log('Total ODPs:', response.data.data.length);
      
      // Show first few ODPs
      response.data.data.slice(0, 10).forEach(odp => {
        console.log(`  ID: ${odp.id} - Name: ${odp.name} - Area: ${odp.area} - Available: ${odp.availableSlots}/${odp.totalSlots}`);
      });
      
      if (response.data.data.length > 10) {
        console.log(`  ... and ${response.data.data.length - 10} more ODPs`);
      }
    } else {
      console.log('❌ API returned no data or failed');
      console.log('Response:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Error testing ODP API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testODPAPI();