# Sidecar Directory Troubleshooting

## Overview

This guide helps troubleshoot issues with XMP sidecar file creation in Docker environments. Sidecar files contain astronomical metadata and are created when images are plate solved.

## Common Issues

### 1. Permission Denied Errors

**Symptoms:**
- Worker process fails to write XMP sidecar files
- Error messages like "EACCES: permission denied" or "ENOENT: no such file or directory"
- Plate solving completes but no sidecar files are created

**Causes:**
- Volume mount permissions not set correctly
- Container running as non-root user without proper directory ownership
- Missing volume mount in Docker Compose

## Solutions

### Docker Compose Configuration

Ensure your `docker-compose.yml` includes the sidecar volume mount:

```yaml
services:
  astromich:
    # ... other configuration ...
    volumes:
      - astromich-config:/app/config
      - astromich-logs:/app/logs
      - astromich-sidecars:/app/sidecars  # Add this line
    environment:
      # ... other environment variables ...
      - XMP_SIDECAR_PATH=/app/sidecars    # Add this line

volumes:
  astromich-config:
    driver: local
  astromich-database:
    driver: local
  astromich-logs:
    driver: local
  astromich-sidecars:    # Add this volume
    driver: local
```

### Unraid Template Configuration

For Unraid users, ensure both the volume mount and environment variable are configured:

1. **Sidecar Directory** (Path): `/mnt/user/appdata/astromich/sidecars`
2. **XMP Sidecar Path** (Variable): `/app/sidecars`

### Manual Permission Fix

If you're still having issues, you can manually fix permissions:

```bash
# Stop the container
docker-compose down

# Create the sidecar directory with correct permissions
mkdir -p /path/to/your/sidecar/directory
chown -R 1001:1001 /path/to/your/sidecar/directory
chmod -R 755 /path/to/your/sidecar/directory

# Restart the container
docker-compose up -d
```

## Testing Sidecar Directory Permissions

### Using the Test Script

We provide a test script to diagnose permission issues:

```bash
# Copy the test script to the container
docker cp tools/scripts/test-sidecar-permissions.js astromich:/app/

# Run the test inside the container
docker exec -it astromich node /app/test-sidecar-permissions.js
```

### Manual Testing

You can also test manually:

```bash
# Enter the container
docker exec -it astromich sh

# Check environment variables
echo $XMP_SIDECAR_PATH
echo $USER
id

# Test directory access
ls -la /app/sidecars
touch /app/sidecars/test.txt
rm /app/sidecars/test.txt
```

## Debugging Steps

### 1. Check Container Logs

```bash
# View container logs
docker-compose logs astromich

# Follow logs in real-time
docker-compose logs -f astromich
```

### 2. Check Volume Mounts

```bash
# Verify volume mounts
docker inspect astromich | grep -A 10 "Mounts"

# Check volume contents
docker run --rm -v astromich-sidecars:/sidecars alpine ls -la /sidecars
```

### 3. Check File Permissions

```bash
# Check permissions on host
ls -la /path/to/your/sidecar/directory

# Check permissions inside container
docker exec astromich ls -la /app/sidecars
```

## Environment Variables

The following environment variables control sidecar file creation:

- `XMP_SIDECAR_PATH`: Directory where XMP sidecar files are written (default: `/app/sidecars`)
- `NODE_ENV`: Application environment (should be `production` in Docker)

## File Structure

Sidecar files are named after the original image with a `.xmp` extension:

```
/app/sidecars/
├── image1.jpg.xmp
├── image2.png.xmp
└── image3.tif.xmp
```

## XMP File Content

Sidecar files contain astronomical metadata in XMP format:

- Plate solving results (RA, Dec, pixel scale, etc.)
- Equipment information
- Astronomical annotations
- Machine tags for object identification

## Troubleshooting Checklist

- [ ] Sidecar volume is mounted in Docker Compose
- [ ] `XMP_SIDECAR_PATH` environment variable is set
- [ ] Directory exists and has correct permissions
- [ ] Container user (UID 1001) has write access
- [ ] No SELinux or AppArmor restrictions
- [ ] Disk space is available
- [ ] File system supports the required operations

## Getting Help

If you're still experiencing issues:

1. Run the test script and share the output
2. Check container logs for specific error messages
3. Verify your Docker Compose configuration
4. Ensure you're using the latest version of the container

## Related Documentation

- [Plate Solving Feature](../docs/PLATE_SOLVING_FEATURE.md)
- [Docker Deployment](../docs/containerization-plan.md)
- [Admin Configuration](../docs/PLATE_SOLVING_FEATURE.md#configuration) 