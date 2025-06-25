// Simple test script to verify worker functionality
import axios from 'axios';

async function testWorker() {
  try {
    console.log('Testing worker functionality...');
    
    // Get current jobs
    const jobsResponse = await axios.get('http://localhost:5000/api/plate-solving/jobs');
    console.log('Current jobs:', jobsResponse.data);
    
    // Get current images
    const imagesResponse = await axios.get('http://localhost:5000/api/images');
    console.log('Current images:', imagesResponse.data.length);
    
    if (imagesResponse.data.length > 0) {
      const firstImage = imagesResponse.data[0];
      console.log('First image:', firstImage.title, 'Plate solved:', firstImage.plateSolved);
    }
    
    console.log('Worker test completed. Check the worker logs for activity.');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testWorker(); 