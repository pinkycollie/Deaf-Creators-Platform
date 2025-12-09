# Compliance Guide

Comprehensive guide for HIPAA, GDPR, SOC 2, and PCI-DSS compliance using Terraform infrastructure.

## 📋 Compliance Standards Supported

- **HIPAA** - Health Insurance Portability and Accountability Act
- **GDPR** - General Data Protection Regulation
- **SOC 2** - Service Organization Control 2
- **PCI-DSS** - Payment Card Industry Data Security Standard

## 🏥 HIPAA Compliance

### Requirements

HIPAA requires specific controls for Protected Health Information (PHI):

### Configuration

```hcl
compliance_standards = ["HIPAA"]

enable_cloudtrail     = true
log_retention_days    = 90  # Minimum 90 days
enable_mfa_requirement = true

enforce_encryption_at_rest    = true
enforce_encryption_in_transit = true
```

### Controls Implemented

✅ **Access Controls** (§164.312(a)(1))
- Zero Trust Access authentication
- MFA enforcement
- Role-based access control

✅ **Audit Controls** (§164.312(b))
- CloudTrail audit logging
- Access logs retention (90+ days)
- CloudWatch monitoring

✅ **Integrity Controls** (§164.312(c)(1))
- Encryption at rest (KMS)
- S3 versioning and lifecycle
- Change tracking via AWS Config

✅ **Transmission Security** (§164.312(e)(1))
- TLS 1.2+ enforced
- Encrypted data in transit
- Secure API endpoints

✅ **Encryption** (§164.312(a)(2)(iv))
- KMS encryption for all data stores
- Encrypted backups
- Secure key management

## 🌍 GDPR Compliance

### Configuration

```hcl
compliance_standards = ["GDPR"]

data_residency_region = "eu-west-1"  # or appropriate EU region
log_retention_days    = 90
```

### Controls Implemented

✅ **Data Protection by Design** (Article 25)
- Encryption by default
- Privacy-first architecture
- Minimal data collection

✅ **Right to Erasure** (Article 17)
- Data lifecycle policies
- Automated data deletion
- 7-year retention compliance

✅ **Data Portability** (Article 20)
- Structured data exports
- API access to user data
- Standard data formats

✅ **Security of Processing** (Article 32)
- Encryption at rest and in transit
- Access controls
- Regular security testing

✅ **Breach Notification** (Article 33)
- CloudTrail for incident detection
- Automated alerting
- Audit trail for investigations

## 🔒 SOC 2 Compliance

### Configuration

```hcl
compliance_standards = ["SOC2"]

enable_cloudtrail      = true
enable_cloudwatch_logs = true
log_retention_days     = 365  # Minimum 1 year
```

### Trust Service Criteria

✅ **Security** (CC6.1-CC6.8)
- Logical access controls
- System operations
- Change management
- Risk mitigation

✅ **Availability** (A1.1-A1.3)
- System availability monitoring
- Incident response
- Backup and recovery

✅ **Processing Integrity** (PI1.1-PI1.5)
- Data validation
- Error handling
- Processing monitoring

✅ **Confidentiality** (C1.1-C1.2)
- Data encryption
- Access restrictions
- Confidential data disposal

## 💳 PCI-DSS Compliance

### Configuration

```hcl
compliance_standards = ["PCI-DSS"]

enable_waf             = true
enable_ddos_protection = true
log_retention_days     = 90
```

### Requirements

✅ **Install and maintain firewall** (Req 1)
- Cloudflare WAF
- Network segmentation
- Firewall rules

✅ **Encrypt transmission** (Req 4)
- TLS 1.2+ enforced
- Strong cryptography
- Certificate management

✅ **Protect stored data** (Req 3)
- KMS encryption
- Secure key management
- Data retention policies

✅ **Regularly test security** (Req 11)
- Vulnerability scanning
- Penetration testing
- Security monitoring

## 🔄 Multi-Compliance Configuration

Enable multiple standards:

```hcl
compliance_standards = ["HIPAA", "GDPR", "SOC2"]

# All controls from all standards are enabled
# Strictest requirements take precedence
```

## 📊 Compliance Monitoring

### Audit Logs

All compliance configurations enable comprehensive audit logging:

```bash
# View CloudTrail logs
aws cloudtrail lookup-events --region us-east-1

# View CloudWatch logs
aws logs tail /aws/deaf-creator-platform/production
```

### Compliance Reports

Terraform generates compliance reports:

```bash
# View compliance configuration
terraform output compliance_report

# Download generated report
cat terraform/modules/compliance/compliance-report-production.json
```

## ✅ Compliance Checklist

### Pre-Deployment

- [ ] Compliance standards identified and configured
- [ ] Encryption keys generated and secured
- [ ] Audit logging enabled
- [ ] Data residency region configured
- [ ] Access controls defined
- [ ] Backup policies configured

### Post-Deployment

- [ ] Verify audit logs are collecting
- [ ] Test access controls
- [ ] Review encryption status
- [ ] Validate backup procedures
- [ ] Document compliance posture
- [ ] Schedule regular audits

### Ongoing

- [ ] Monthly audit log reviews
- [ ] Quarterly access reviews
- [ ] Annual penetration testing
- [ ] Regular compliance training
- [ ] Incident response testing
- [ ] Policy updates as needed

## 📚 Additional Resources

- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [GDPR Official Text](https://gdpr-info.eu/)
- [SOC 2 Framework](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/socforserviceorganizations)
- [PCI-DSS Standards](https://www.pcisecuritystandards.org/)

---

**Last Updated**: December 2025  
**Version**: 1.0.0
