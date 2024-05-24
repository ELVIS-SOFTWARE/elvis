import React from 'react';

export default function UserAvatar({ user, size }) {
    const userInitials = user.full_name.split(' ').map(name => name[0]).join('');
    return (
        user.avatar ? (
                <img src={user.avatar} alt="avatar" style={{
                    borderRadius: "50%",
                    width: `${size}px`,
                    height: `${size}px`,
                    margin: "10px 10px 10px 0",
                    objectFit: "cover"
                }}/>
            ) :
            <div style={{
                backgroundColor: "#fac5c7",
                borderRadius: "50%",
                width: `${size}px`,
                height: `${size}px`,
                margin: "10px 20px 10px 0",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#FF6066",
                fontWeight: "bold",
                fontSize: "20px"
            }}>
                {userInitials}
            </div>
    );
};