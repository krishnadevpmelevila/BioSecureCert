// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UserManagement {
    struct User {
        string username;
        bytes32 passwordHash;
        address userAddress;
    }

    mapping(string => User) private users; // Map by username
    mapping(string => bool) private usernames;

    event UserRegistered(address userAddress, string username);

    // Register a new user
    function registerUser(string memory _username, bytes32 _passwordHash) public {
        require(!usernames[_username], "Username already exists");

        users[_username] = User({
            username: _username,
            passwordHash: _passwordHash,
            userAddress: msg.sender
        });

        usernames[_username] = true;

        emit UserRegistered(msg.sender, _username);
    }

    // Verify user login
    function loginUser(string memory _username, bytes32 _passwordHash) public view returns (bool) {
        User memory user = users[_username];
        require(bytes(user.username).length != 0, "User not registered");

        return (user.passwordHash == _passwordHash);
    }
}
