import React from 'react';

export default function UserAvatar({ avatar, full_name }) {
    const userInitials = full_name.split(' ').map(name => name[0]).join('');
    return (
        avatar ? (
                <img src={avatar} alt="avatar" style={{
                    borderRadius: "50%",
                    width: "50px",
                    height: "50px",
                    margin: "10px 10px 10px 0"
                }}/>
            ) :
            <div style={{
                backgroundColor: "#fac5c7",
                borderRadius: "50%",
                width: "50px",
                height: "50px",
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