window.onload = function () {
  const canvas = document.getElementById("myCanvas");
  const ctx = canvas.getContext("2d");
  const segments = []; // Array to hold line segments
  const points = []; // Array to hold points
  const distanceLabels = []; // Array to hold distance labels
  let startPoint = null;
  let isDragging = false;
  let isFirstSegment = true; // Flag to track the first segment
  let pointCounter = 0; // Counter for points
  const SNAP_DISTANCE = 10; // Distance to snap to existing points
  const PIXEL_TO_CM = 0.0264;

  // Function to draw a line segment
  function drawSegment(start, end) {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  // Function to draw a point with alphabet label
  function drawPointWithLabel(point, label) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillText(label, point.x + 5, point.y - 5);
  }

  // Function to draw reference grid lines and origin point
  function drawReferenceGrid() {
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = 10; x < canvas.width; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 10; y < canvas.height; y += 10) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw origin point labeled 'O'

    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
  }

  // Function to redraw all points and segments
  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawReferenceGrid();
    for (const segment of segments) {
      drawSegment(segment.start, segment.end);
    }
    for (let i = 0; i < points.length; i++) {
      drawPointWithLabel(points[i], String.fromCharCode(65 + i));
    }
  }

  // Function to find the nearest point within a certain distance
  function findNearestPoint(x, y) {
    let nearestPoint = null;
    let minDistance = SNAP_DISTANCE;
    for (const point of points) {
      const distance = Math.sqrt(
        Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    }
    return nearestPoint;
  }

  // Function to check if a shape is closed
  function isShapeClosed() {
    if (segments.length < 3) return false;
    const firstPoint = segments[0].start;
    const lastPoint = segments[segments.length - 1].end;
    const distance = Math.sqrt(
      Math.pow(firstPoint.x - lastPoint.x, 2) +
        Math.pow(firstPoint.y - lastPoint.y, 2)
    );
    return distance < SNAP_DISTANCE;
  }
  // Function to create a distance label
  function createDistanceLabel(distance, x, y) {
    const distanceLabel = document.createElement("div");
    distanceLabel.className = "distanceLabel";
    distanceLabel.style.left = `${x}px`;
    distanceLabel.style.top = `${y}px`;
    distanceLabel.textContent = `${distance.toFixed(2)} cm`;
    document.body.appendChild(distanceLabel);
    return distanceLabel;
  }

  // Function to update all distance labels
  function updateDistanceLabels() {
    for (let i = 0; i < distanceLabels.length; i++) {
      const segment = segments[i];
      const label = distanceLabels[i];
      const midX = (segment.start.x + segment.end.x) / 2 + canvas.offsetLeft;
      const midY = (segment.start.y + segment.end.y) / 2 + canvas.offsetTop;
      const distance =
        Math.sqrt(
          Math.pow(segment.end.x - segment.start.x, 2) +
            Math.pow(segment.end.y - segment.start.y, 2)
        ) * PIXEL_TO_CM;
      label.style.left = `${midX}px`;
      label.style.top = `${midY}px`;
      label.textContent = `${distance.toFixed(2)} cm`;
    }
  }

  // Event listener for mouse down
  canvas.addEventListener("mousedown", function (event) {
    const mouseX = event.pageX - canvas.offsetLeft;
    const mouseY = event.pageY - canvas.offsetTop;

    if (isShapeClosed()) return; // Do nothing if the shape is closed

    const nearestPoint = findNearestPoint(mouseX, mouseY);

    if (isFirstSegment) {
      if (startPoint === null) {
        startPoint = { x: mouseX, y: mouseY };
        // Draw the starting point
        pointCounter++;
        const label = String.fromCharCode(65 + pointCounter - 1);
        points.push(startPoint);
        drawPointWithLabel(startPoint, label);
        isDragging = true;
      }
    } else {
      if (nearestPoint) {
        // Connect to the nearest point within the snap distance
        const endPoint = nearestPoint;
        segments.push({ start: startPoint, end: endPoint });
        drawSegment(startPoint, endPoint);
        const midX = (startPoint.x + endPoint.x) / 2 + canvas.offsetLeft;
        const midY = (startPoint.y + endPoint.y) / 2 + canvas.offsetTop;
        const distance =
          Math.sqrt(
            Math.pow(endPoint.x - startPoint.x, 2) +
              Math.pow(endPoint.y - startPoint.y, 2)
          ) * PIXEL_TO_CM;
        distanceLabels.push(createDistanceLabel(distance, midX, midY));
        startPoint = endPoint;
      } else {
        // Create a new point and segment
        const endPoint = { x: mouseX, y: mouseY };
        pointCounter++;
        const label = String.fromCharCode(65 + pointCounter - 1);
        points.push(endPoint);
        drawPointWithLabel(endPoint, label);
        if (pointCounter === 3) {
          const firstPoint = points[0];
          const secondPoint = points[1];
          const distanceToFirst = Math.sqrt(
            Math.pow(firstPoint.x - endPoint.x, 2) +
              Math.pow(firstPoint.y - endPoint.y, 2)
          );
          const distanceToSecond = Math.sqrt(
            Math.pow(secondPoint.x - endPoint.x, 2) +
              Math.pow(secondPoint.y - endPoint.y, 2)
          );
          startPoint =
            distanceToFirst < distanceToSecond ? firstPoint : secondPoint;
          console.log(startPoint);
        }
        segments.push({ start: startPoint, end: endPoint });
        drawSegment(startPoint, endPoint);
        const midX = (startPoint.x + endPoint.x) / 2 + canvas.offsetLeft;
        const midY = (startPoint.y + endPoint.y) / 2 + canvas.offsetTop;
        const distance =
          Math.sqrt(
            Math.pow(endPoint.x - startPoint.x, 2) +
              Math.pow(endPoint.y - startPoint.y, 2)
          ) * PIXEL_TO_CM;
        distanceLabels.push(createDistanceLabel(distance, midX, midY));
        startPoint = endPoint;
      }
      if (isShapeClosed()) {
        startPoint = null;
      }
    }
    redraw(); // Redraw all points and segments to maintain the visual state
  });

  // Event listener for mouse move
  canvas.addEventListener("mousemove", function (event) {
    if (isDragging && startPoint) {
      const mouseX = event.pageX - canvas.offsetLeft;
      const mouseY = event.pageY - canvas.offsetTop;

      redraw();

      drawSegment(startPoint, { x: mouseX, y: mouseY });
    }
  });

  // Event listener for mouse up
  canvas.addEventListener("mouseup", function (event) {
    if (isDragging && startPoint) {
      const mouseX = event.pageX - canvas.offsetLeft;
      const mouseY = event.pageY - canvas.offsetTop;
      const nearestPoint = findNearestPoint(mouseX, mouseY);
      if (nearestPoint) {
        const endPoint = nearestPoint;
        segments.push({ start: startPoint, end: endPoint });
        drawSegment(startPoint, endPoint);
        startPoint = endPoint;
      } else {
        const endPoint = { x: mouseX, y: mouseY };
        segments.push({ start: startPoint, end: endPoint });
        drawSegment(startPoint, endPoint);
        pointCounter++;
        const label = String.fromCharCode(65 + pointCounter - 1);
        points.push(endPoint);
        drawPointWithLabel(endPoint, label);
        const midX = (startPoint.x + endPoint.x) / 2 + canvas.offsetLeft;
        const midY = (startPoint.y + endPoint.y) / 2 + canvas.offsetTop;
        const distance =
          Math.sqrt(
            Math.pow(endPoint.x - startPoint.x, 2) +
              Math.pow(endPoint.y - startPoint.y, 2)
          ) * PIXEL_TO_CM;
        distanceLabels.push(createDistanceLabel(distance, midX, midY));
        startPoint = endPoint;
      }
      isDragging = false;
      isFirstSegment = false;
    }
    redraw(); // Redraw all points and segments to maintain the visual state
  });

  // Ensure that text is properly aligned and clear
  ctx.textBaseline = "top";
  ctx.font = "12px Arial";

  // Initial draw to set up the grid
  redraw();
};