window.onload = function () {
  const canvas = document.getElementById("myCanvas");
  const ctx = canvas.getContext("2d");
  const segments = []; // Array to hold line segments
  const points = []; // Array to hold points

  let startPoint = null;
  let isDragging = false;
  let isFirstSegment = true; // Flag to track the first segment
  let pointCounter = 0; // Counter for points
  const SNAP_DISTANCE = 10; // Distance to snap to existing points

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

  // Function to redraw all points and segments
  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const segment of segments) {
      drawSegment(segment.start, segment.end);
    }
    for (let i = 0; i < points.length; i++) {
      drawPointWithLabel(points[i], String.fromCharCode(65 + i));
    }
  }

  // Function to find the nearest point within a certain distance using k-d tree
  function findNearestPoint(x, y) {
    if (kdTree.root === null) return null;
    const nearest = kdTree.nearest([x, y]);
    if (!nearest) return null;

    const distance = Math.sqrt((nearest[0] - x) ** 2 + (nearest[1] - y) ** 2);
    if (distance < SNAP_DISTANCE) {
      return { x: nearest[0], y: nearest[1] };
    }
    return null;
  }

  // Function to check if a shape is closed
  function isShapeClosed() {
    if (segments.length < 3) return false;
    const firstPoint = segments[0].start;
    const lastPoint = segments[segments.length - 1].end;
    const distance = Math.sqrt(
      (firstPoint.x - lastPoint.x) ** 2 + (firstPoint.y - lastPoint.y) ** 2
    );
    return distance < SNAP_DISTANCE;
  }

  // Event listener for mouse down
  canvas.addEventListener("mousedown", function (event) {
    const mouseX = event.pageX - canvas.offsetLeft;
    const mouseY = event.pageY - canvas.offsetTop;

    if (isShapeClosed()) return; // Do nothing if the shape is closed

    const nearestPoint = findNearestPoint(mouseX, mouseY);

    if (isFirstSegment) {
      if (!startPoint) {
        startPoint = { x: mouseX, y: mouseY };
        // Draw the starting point
        pointCounter++;
        const label = String.fromCharCode(65 + pointCounter - 1);
        points.push(startPoint);
        kdTree = new KDTree(points.map(p => [p.x, p.y])); // Update k-d tree
        drawPointWithLabel(startPoint, label);
        isDragging = true;
      }
    } else {
      if (nearestPoint) {
        // Connect to the nearest point within the snap distance
        const endPoint = nearestPoint;
        segments.push({ start: startPoint, end: endPoint });
        startPoint = endPoint;
      } else {
        // Create a new point and segment
        const endPoint = { x: mouseX, y: mouseY };
        pointCounter++;
        const label = String.fromCharCode(65 + pointCounter - 1);
        points.push(endPoint);
        kdTree = new KDTree(points.map(p => [p.x, p.y])); // Update k-d tree
        drawPointWithLabel(endPoint, label);
        segments.push({ start: startPoint, end: endPoint });
        startPoint = endPoint;
      }
      if (isShapeClosed()) {
        startPoint = null;
        isDragging = false;
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
      const endPoint = { x: mouseX, y: mouseY };
      segments.push({ start: startPoint, end: endPoint });
      drawSegment(startPoint, endPoint);
      // Draw the ending point
      pointCounter++;
      const label = String.fromCharCode(65 + pointCounter - 1);
      points.push(endPoint);
      kdTree = new KDTree(points.map(p => [p.x, p.y])); // Update k


class KDNode {
  constructor(point, axis) {
    this.point = point;
    this.left = null;
    this.right = null;
    this.axis = axis;
  }
}

class KDTree {
  constructor(points, depth = 0) {
    if (points.length === 0) {
      this.root = null;
    } else {
      const k = points[0].length;
      const axis = depth % k;

      points.sort((a, b) => a[axis] - b[axis]);
      const medianIndex = Math.floor(points.length / 2);

      this.root = new KDNode(points[medianIndex], axis);
      this.root.left = new KDTree(points.slice(0, medianIndex), depth + 1).root;
      this.root.right = new KDTree(
        points.slice(medianIndex + 1),
        depth + 1
      ).root;
    }
  }

  nearest(point, best = null, depth = 0) {
    if (this.root === null) {
      return best;
    }

    const axis = this.root.axis;
    const nextBranch =
      point[axis] < this.root.point[axis] ? this.root.left : this.root.right;
    const oppositeBranch =
      point[axis] < this.root.point[axis] ? this.root.right : this.root.left;

    best = this.closerDistance(point, best, this.root.point);

    if (nextBranch) {
      best = new KDTree(nextBranch).nearest(point, best, depth + 1);
    }

    if (oppositeBranch) {
      const distanceToBest = this.distanceSquared(point, best);
      const distanceToAxis = (point[axis] - this.root.point[axis]) ** 2;
      if (distanceToAxis < distanceToBest) {
        best = new KDTree(oppositeBranch).nearest(point, best, depth + 1);
      }
    }

    return best;
  }

  closerDistance(point, p1, p2) {
    if (!p1) return p2;
    if (!p2) return p1;

    const d1 = this.distanceSquared(point, p1);
    const d2 = this.distanceSquared(point, p2);

    return d1 < d2 ? p1 : p2;
  }

  distanceSquared(point1, point2) {
    return point1.reduce(
      (sum, coord, index) => sum + (coord - point2[index]) ** 2,
      0
    );
  }
}
