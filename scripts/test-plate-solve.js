// Test script to submit a plate-solving job and verify worker functionality
import axios from 'axios';

async function testPlateSolving() {
  try {
    console.log('Testing plate-solving job submission and worker access...');
    
    // First, let's get the current jobs
    const jobsResponse = await axios.get('http://localhost:5000/api/plate-solving/jobs');
    console.log('Current jobs before submission:', jobsResponse.data);
    
    // Get images to find one that's not plate-solved
    const imagesResponse = await axios.get('http://localhost:5000/api/images');
    const unsolvedImage = imagesResponse.data.find(img => !img.plateSolved);
    
    if (!unsolvedImage) {
      console.log('No unsolved images found. Creating a test job manually...');
      
      // Create a test job by directly calling the storage
      const testJob = {
        imageId: 1,
        astrometryJobId: "test-123",
        status: "processing",
        result: null
      };
      
      // We can't directly access storage from here, so let's just check if the worker is running
      console.log('Worker should be running and checking for jobs every 30 seconds');
      console.log('Check the worker logs for activity');
      return;
    }
    
    console.log('Found unsolved image:', unsolvedImage.title);
    console.log('Submitting for plate solving...');
    
    // Submit the image for plate solving
    const plateSolveResponse = await axios.post(`http://localhost:5000/api/images/${unsolvedImage.id}/plate-solve`);
    console.log('Plate solving submission response:', plateSolveResponse.data);
    
    // Wait a moment and check jobs again
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const jobsAfterResponse = await axios.get('http://localhost:5000/api/plate-solving/jobs');
    console.log('Jobs after submission:', jobsAfterResponse.data);
    
    console.log('Test completed. The worker should now be monitoring this job.');
    console.log('Check the worker logs for activity every 30 seconds.');
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testPlateSolving(); 