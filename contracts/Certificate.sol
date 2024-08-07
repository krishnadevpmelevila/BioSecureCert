// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Certificate {

    struct Cert {
        string name;
        string email;
        string fingerprint;
        string authority;
        string certificateType;
        string college;
        string phone;
        string eventName; // Changed from event to eventName
        string comment;
        string hash;
        string uuid;
        address issuer;
    }

    mapping(string => Cert) public certificates;
    mapping(string => bool) public revoked;

    event CertificateIssued(string uuid, address issuer);
    event CertificateRevoked(string uuid, address issuer);

    // Issue a new certificate
    function issueCertificate(
        string memory _uuid,
        string memory _name,
        string memory _email,
        string memory _fingerprint,
        string memory _authority,
        string memory _certificateType,
        string memory _college,
        string memory _phone,
        string memory _eventName, // Changed from _event to _eventName
        string memory _comment,
        string memory _hash
    ) public {
        require(bytes(certificates[_uuid].uuid).length == 0, "Certificate already exists");

        certificates[_uuid] = Cert({
            name: _name,
            email: _email,
            fingerprint: _fingerprint,
            authority: _authority,
            certificateType: _certificateType,
            college: _college,
            phone: _phone,
            eventName: _eventName, // Changed from event to eventName
            comment: _comment,
            hash: _hash,
            uuid: _uuid,
            issuer: msg.sender
        });

        emit CertificateIssued(_uuid, msg.sender);
    }

    // Revoke an existing certificate
    function revokeCertificate(string memory _uuid) public {
        require(msg.sender == certificates[_uuid].issuer, "Not authorized to revoke");
        require(!revoked[_uuid], "Certificate already revoked");

        revoked[_uuid] = true;

        emit CertificateRevoked(_uuid, msg.sender);
    }

    // Verify a certificate
    function verifyCertificate(string memory _uuid, string memory _hash, string memory _fingerprint) public view returns (bool) {
        Cert memory cert = certificates[_uuid];
        require(bytes(cert.uuid).length != 0, "Certificate not found");
        require(!revoked[_uuid], "Certificate revoked");

        return (keccak256(abi.encodePacked(cert.hash)) == keccak256(abi.encodePacked(_hash)) &&
                keccak256(abi.encodePacked(cert.fingerprint)) == keccak256(abi.encodePacked(_fingerprint)));
    }
}
