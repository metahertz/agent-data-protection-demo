const now = new Date()
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000)

export const configBackupSeedData = [
  // core-rtr-01 — Cisco ASR1001-X
  {
    hostname: 'core-rtr-01',
    backup_time: daysAgo(1),
    triggered_by: 'scheduled' as const,
    version_label: 'v2024.03.21',
    config_text: `! Backup: ${daysAgo(1).toISOString()}
! Device: core-rtr-01 (10.0.0.1)
version 17.6
service timestamps debug datetime msec
service timestamps log datetime msec
service password-encryption
!
hostname core-rtr-01
!
enable secret 9 $9$mERrXp3V0XkE3.$RrVANxXjB5lG8YH1Qa2eUkBvzCz5fXoA3wP1sQ7mNdI
!
username admin privilege 15 secret 9 $9$abcXYZ123defGHI$lmNoPqRsTuVwXyZaB1cDeFgHiJkLm
!
aaa new-model
aaa authentication login default local
aaa authorization exec default local
!
ip domain name corp.internal
ip name-server 10.0.0.10
ip name-server 10.0.0.11
!
crypto key generate rsa modulus 4096
!
interface GigabitEthernet0/0/0
 description UPLINK-TO-ISP
 ip address 10.0.0.1 255.255.255.0
 no shutdown
!
interface GigabitEthernet0/0/1
 description LINK-TO-CORE-SW-01
 ip address 10.0.2.254 255.255.255.0
 no shutdown
!
interface GigabitEthernet0/0/2
 description LINK-TO-CORE-RTR-02
 ip address 10.0.0.1 255.255.255.252
 no shutdown
!
router ospf 1
 router-id 10.0.0.1
 network 10.0.0.0 0.0.0.255 area 0
 network 10.0.2.0 0.0.0.255 area 0
!
router bgp 65001
 bgp router-id 10.0.0.1
 neighbor 10.0.0.2 remote-as 65001
 neighbor 10.0.0.2 description IBGP-PEER-CORE-RTR-02
!
snmp-server community corp-private-rw RW
snmp-server community corp-read RO
snmp-server host 10.0.5.1 version 2c corp-private-rw
snmp-server enable traps
!
logging host 10.0.5.1
logging trap informational
!
ntp server 10.0.0.10
ntp server 10.0.0.11 prefer
!
line vty 0 4
 login local
 transport input ssh
 exec-timeout 15 0
!
line con 0
 login local
 exec-timeout 10 0
!
end`,
    size_bytes: 2048,
  },
  {
    hostname: 'core-rtr-01',
    backup_time: daysAgo(30),
    triggered_by: 'manual' as const,
    version_label: 'v2024.02.20',
    config_text: `! Backup: ${daysAgo(30).toISOString()}
! Device: core-rtr-01 (10.0.0.1)
version 17.6
service timestamps debug datetime msec
service timestamps log datetime msec
!
hostname core-rtr-01
!
enable secret 9 $9$mERrXp3V0XkE3.$RrVANxXjB5lG8YH1Qa2eUkBvzCz5fXoA3wP1sQ7mNdI
!
username admin privilege 15 secret 9 $9$abcXYZ123defGHI$lmNoPqRsTuVwXyZaB1cDeFgHiJkLm
!
interface GigabitEthernet0/0/0
 description UPLINK-TO-ISP
 ip address 10.0.0.1 255.255.255.0
 no shutdown
!
snmp-server community corp-private-rw RW
snmp-server community corp-read RO
!
line vty 0 4
 login local
 transport input ssh
!
end`,
    size_bytes: 1456,
  },
  {
    hostname: 'core-rtr-01',
    backup_time: daysAgo(60),
    triggered_by: 'pre-change' as const,
    version_label: 'v2024.01.21',
    config_text: `! Backup: ${daysAgo(60).toISOString()}
! Device: core-rtr-01 (10.0.0.1)
version 17.6
hostname core-rtr-01
!
enable secret 9 $9$mERrXp3V0XkE3.$RrVANxXjB5lG8YH1Qa2eUkBvzCz5fXoA3wP1sQ7mNdI
!
interface GigabitEthernet0/0/0
 ip address 10.0.0.1 255.255.255.0
 no shutdown
!
snmp-server community corp-private-rw RW
!
line vty 0 4
 transport input ssh
!
end`,
    size_bytes: 892,
  },

  // core-rtr-02 — Cisco ASR1001-X
  {
    hostname: 'core-rtr-02',
    backup_time: daysAgo(1),
    triggered_by: 'scheduled' as const,
    version_label: 'v2024.03.21',
    config_text: `! Backup: ${daysAgo(1).toISOString()}
! Device: core-rtr-02 (10.0.0.2)
version 17.6
service timestamps debug datetime msec
service timestamps log datetime msec
service password-encryption
!
hostname core-rtr-02
!
enable secret 9 $9$nFSsYq4W1YlF4.$SsWBOyYkC6mH9ZI2Rb3fVlCwaDa6gYpB4xQ2tR8nOeJ
!
username admin privilege 15 secret 9 $9$xyzABC456ghiJKL$mnOPqRsTuVwXyZaB1cDeFgHiJkLm
!
interface GigabitEthernet0/0/0
 description UPLINK-TO-ISP-BACKUP
 ip address 10.0.0.2 255.255.255.0
 no shutdown
!
interface GigabitEthernet0/0/1
 description LINK-TO-CORE-SW-02
 ip address 10.0.2.253 255.255.255.0
 no shutdown
!
router ospf 1
 router-id 10.0.0.2
 network 10.0.0.0 0.0.0.255 area 0
!
snmp-server community corp-private-rw RW
snmp-server community corp-read RO
!
line vty 0 4
 login local
 transport input ssh
!
end`,
    size_bytes: 1812,
  },
  {
    hostname: 'core-rtr-02',
    backup_time: daysAgo(31),
    triggered_by: 'scheduled' as const,
    version_label: 'v2024.02.19',
    config_text: `! Backup: ${daysAgo(31).toISOString()}
! Device: core-rtr-02 (10.0.0.2)
version 17.6
hostname core-rtr-02
!
enable secret 9 $9$nFSsYq4W1YlF4.$SsWBOyYkC6mH9ZI2Rb3fVlCwaDa6gYpB4xQ2tR8nOeJ
!
interface GigabitEthernet0/0/0
 ip address 10.0.0.2 255.255.255.0
 no shutdown
!
snmp-server community corp-private-rw RW
!
line vty 0 4
 transport input ssh
!
end`,
    size_bytes: 901,
  },

  // edge-rtr-01 — Juniper MX204
  {
    hostname: 'edge-rtr-01',
    backup_time: daysAgo(2),
    triggered_by: 'scheduled' as const,
    version_label: 'v2024.03.20',
    config_text: `## Backup: ${daysAgo(2).toISOString()}
## Device: edge-rtr-01 (10.0.1.1)
version 21.4R3-S5;
system {
    host-name edge-rtr-01;
    domain-name corp.internal;
    root-authentication {
        encrypted-password "$6$Qx8zR$aBcDeFgHiJkLmNoPqRsTuVwXyZaB1cDeFgHiJkLmNoPqRs";
    }
    login {
        user netops {
            uid 2001;
            class super-user;
            authentication {
                encrypted-password "$6$Rx9yS$bCdEfGhIjKlMnOpQrStUvWxYzAb2cdEfGhIjKlMnOpQrS";
            }
        }
    }
    services {
        ssh {
            root-login deny;
            max-sessions-per-connection 4;
        }
        netconf {
            ssh;
        }
    }
    syslog {
        host 10.0.5.1 {
            any info;
        }
    }
    ntp {
        server 10.0.0.10;
        server 10.0.0.11 prefer;
    }
}
interfaces {
    ge-0/0/0 {
        description "UPLINK-TO-TRANSIT";
        unit 0 {
            family inet {
                address 10.0.1.1/24;
            }
        }
    }
    ge-0/0/1 {
        description "LINK-TO-CORE-RTR-01";
        unit 0 {
            family inet {
                address 10.0.1.254/30;
            }
        }
    }
}
routing-options {
    router-id 10.0.1.1;
    autonomous-system 65001;
}
protocols {
    bgp {
        group EBGP-TRANSIT {
            type external;
            peer-as 65000;
            neighbor 203.0.113.1;
        }
    }
    ospf {
        area 0.0.0.0 {
            interface ge-0/0/1.0;
        }
    }
}
snmp {
    community edge-snmp-ro {
        authorization read-only;
    }
    trap-group traps {
        targets {
            10.0.5.1;
        }
    }
}`,
    size_bytes: 2634,
  },
  {
    hostname: 'edge-rtr-01',
    backup_time: daysAgo(62),
    triggered_by: 'pre-change' as const,
    version_label: 'v2024.01.19',
    config_text: `## Backup: ${daysAgo(62).toISOString()}
## Device: edge-rtr-01 (10.0.1.1)
version 21.4R3-S5;
system {
    host-name edge-rtr-01;
    login {
        user netops {
            class super-user;
        }
    }
    services {
        ssh;
    }
}
interfaces {
    ge-0/0/0 {
        description "UPLINK";
        unit 0 {
            family inet {
                address 10.0.1.1/24;
            }
        }
    }
}
snmp {
    community edge-snmp-ro {
        authorization read-only;
    }
}`,
    size_bytes: 1102,
  },

  // branch-rtr-01 — Cisco ISR4331
  {
    hostname: 'branch-rtr-01',
    backup_time: daysAgo(3),
    triggered_by: 'manual' as const,
    version_label: 'v2024.03.19',
    config_text: `! Backup: ${daysAgo(3).toISOString()}
! Device: branch-rtr-01 (10.1.0.1)
version 16.9
service timestamps debug datetime msec
service timestamps log datetime msec
service password-encryption
!
hostname branch-rtr-01
!
enable secret 9 $9$oGTtZr5X2ZmG5.$TtXCPzZlD7nI0AJ3Sc4gWmDxbEb7hZqC5yR3uS9oPfK
!
username admin privilege 15 secret 9 $9$defGHI789jklMNO$noPqRsTuVwXyZaB1cDeFgHiJkLm
!
interface GigabitEthernet0/0/0
 description WAN-LINK-TO-MPLS
 ip address 10.1.0.1 255.255.255.0
 no shutdown
!
interface GigabitEthernet0/0/1
 description LAN-NYC-OFFICE
 ip address 192.168.10.1 255.255.255.0
 no shutdown
!
router ospf 1
 router-id 10.1.0.1
 network 10.1.0.0 0.0.0.255 area 1
 network 192.168.10.0 0.0.0.255 area 1
!
ip route 0.0.0.0 0.0.0.0 10.1.0.254
!
snmp-server community branch-ro RO
snmp-server host 10.0.5.1 version 2c branch-ro
!
logging host 10.0.5.1
!
line vty 0 4
 login local
 transport input ssh
 exec-timeout 10 0
!
end`,
    size_bytes: 1734,
  },
  {
    hostname: 'branch-rtr-01',
    backup_time: daysAgo(35),
    triggered_by: 'scheduled' as const,
    version_label: 'v2024.02.15',
    config_text: `! Backup: ${daysAgo(35).toISOString()}
! Device: branch-rtr-01 (10.1.0.1)
version 16.9
hostname branch-rtr-01
!
enable secret 9 $9$oGTtZr5X2ZmG5.$TtXCPzZlD7nI0AJ3Sc4gWmDxbEb7hZqC5yR3uS9oPfK
!
interface GigabitEthernet0/0/0
 ip address 10.1.0.1 255.255.255.0
 no shutdown
!
snmp-server community branch-ro RO
!
line vty 0 4
 transport input ssh
!
end`,
    size_bytes: 788,
  },

  // branch-rtr-02 — Cisco ISR4331
  {
    hostname: 'branch-rtr-02',
    backup_time: daysAgo(1),
    triggered_by: 'scheduled' as const,
    version_label: 'v2024.03.21',
    config_text: `! Backup: ${daysAgo(1).toISOString()}
! Device: branch-rtr-02 (10.2.0.1)
version 16.9
service timestamps debug datetime msec
service timestamps log datetime msec
service password-encryption
!
hostname branch-rtr-02
!
enable secret 9 $9$pHUuAs6Y3AnH6.$UuYDQaAmE8oJ1BK4Td5hXnEyCc8iArD6zS4vT0qPgL
!
username admin privilege 15 secret 9 $9$ghiJKL012mnoPQR$opQrStUvWxYzAb2cdEfGhIjKlMn
!
interface GigabitEthernet0/0/0
 description WAN-LINK-TO-MPLS
 ip address 10.2.0.1 255.255.255.0
 no shutdown
!
interface GigabitEthernet0/0/1
 description LAN-LAX-OFFICE
 ip address 192.168.20.1 255.255.255.0
 no shutdown
!
router ospf 1
 router-id 10.2.0.1
 network 10.2.0.0 0.0.0.255 area 2
!
snmp-server community branch-ro RO
snmp-server host 10.0.5.1 version 2c branch-ro
!
line vty 0 4
 login local
 transport input ssh
!
end`,
    size_bytes: 1589,
  },
  {
    hostname: 'branch-rtr-02',
    backup_time: daysAgo(61),
    triggered_by: 'pre-change' as const,
    version_label: 'v2024.01.20',
    config_text: `! Backup: ${daysAgo(61).toISOString()}
! Device: branch-rtr-02 (10.2.0.1)
version 16.9
hostname branch-rtr-02
!
enable secret 9 $9$pHUuAs6Y3AnH6.$UuYDQaAmE8oJ1BK4Td5hXnEyCc8iArD6zS4vT0qPgL
!
interface GigabitEthernet0/0/0
 ip address 10.2.0.1 255.255.255.0
 no shutdown
!
snmp-server community branch-ro RO
!
line vty 0 4
 transport input ssh
!
end`,
    size_bytes: 623,
  },

  // core-sw-01 — Cisco Catalyst 9500
  {
    hostname: 'core-sw-01',
    backup_time: daysAgo(1),
    triggered_by: 'scheduled' as const,
    version_label: 'v2024.03.21',
    config_text: `! Backup: ${daysAgo(1).toISOString()}
! Device: core-sw-01 (10.0.2.1)
version 17.6
service timestamps log datetime msec
service password-encryption
!
hostname core-sw-01
!
enable secret 9 $9$qIVvBt7Z4BoI7.$VvZERbBnF9pK2CL5Ue6iYoFzDd9jBsE7aT5wU1rQhM
!
username admin privilege 15 secret 9 $9$jklMNO345pqrSTU$pqRsTuVwXyZaB1cDeFgHiJkLmNo
!
vlan 10
 name MANAGEMENT
vlan 20
 name SERVERS
vlan 30
 name USER-DATA
!
interface Vlan10
 description MANAGEMENT-VLAN
 ip address 10.0.2.1 255.255.255.0
 no shutdown
!
interface GigabitEthernet1/0/1
 description UPLINK-TO-CORE-RTR-01
 switchport mode trunk
 no shutdown
!
interface GigabitEthernet1/0/2
 description UPLINK-TO-CORE-RTR-02
 switchport mode trunk
 no shutdown
!
interface GigabitEthernet1/0/3
 description LINK-TO-DIST-SW-01
 switchport mode trunk
 no shutdown
!
spanning-tree mode rapid-pvst
spanning-tree portfast default
!
snmp-server community corp-private-rw RW
snmp-server community corp-read RO
snmp-server host 10.0.5.1 version 2c corp-private-rw
!
ip ssh version 2
!
line vty 0 15
 login local
 transport input ssh
!
end`,
    size_bytes: 2156,
  },
  {
    hostname: 'core-sw-01',
    backup_time: daysAgo(33),
    triggered_by: 'scheduled' as const,
    version_label: 'v2024.02.17',
    config_text: `! Backup: ${daysAgo(33).toISOString()}
! Device: core-sw-01 (10.0.2.1)
version 17.6
hostname core-sw-01
!
enable secret 9 $9$qIVvBt7Z4BoI7.$VvZERbBnF9pK2CL5Ue6iYoFzDd9jBsE7aT5wU1rQhM
!
interface Vlan10
 ip address 10.0.2.1 255.255.255.0
 no shutdown
!
snmp-server community corp-private-rw RW
!
line vty 0 15
 transport input ssh
!
end`,
    size_bytes: 712,
  },

  // core-sw-02 — Cisco Catalyst 9500
  {
    hostname: 'core-sw-02',
    backup_time: daysAgo(1),
    triggered_by: 'scheduled' as const,
    version_label: 'v2024.03.21',
    config_text: `! Backup: ${daysAgo(1).toISOString()}
! Device: core-sw-02 (10.0.2.2)
version 17.6
service timestamps log datetime msec
service password-encryption
!
hostname core-sw-02
!
enable secret 9 $9$rJWwCu8A5CpJ8.$WwAFScCoG0qL3DM6Vf7jZpGaEe0kCtF8bU6xV2sRiN
!
username admin privilege 15 secret 9 $9$mnoPQR678stuvWX$qrStUvWxYzAb2cdEfGhIjKlMnOp
!
vlan 10
 name MANAGEMENT
vlan 20
 name SERVERS
!
interface Vlan10
 description MANAGEMENT-VLAN
 ip address 10.0.2.2 255.255.255.0
 no shutdown
!
spanning-tree mode rapid-pvst
!
snmp-server community corp-private-rw RW
snmp-server community corp-read RO
!
line vty 0 15
 login local
 transport input ssh
!
end`,
    size_bytes: 1623,
  },

  // dist-sw-01 — Cisco Catalyst 9300
  {
    hostname: 'dist-sw-01',
    backup_time: daysAgo(2),
    triggered_by: 'scheduled' as const,
    version_label: 'v2024.03.20',
    config_text: `! Backup: ${daysAgo(2).toISOString()}
! Device: dist-sw-01 (10.0.3.1)
version 16.12
service timestamps log datetime msec
service password-encryption
!
hostname dist-sw-01
!
enable secret 9 $9$sKXxDv9B6DqK9.$XxBGTdDpH1rM4EN7Wg8kAqHbFf1lDuG9cV7yW3tSjO
!
username netadmin privilege 15 secret 9 $9$opqRST901uvwXYZ$rsTuVwXyZaB1cDeFgHiJkLmNoPq
!
interface Vlan1
 ip address 10.0.3.1 255.255.255.0
 no shutdown
!
interface GigabitEthernet1/0/1
 description UPLINK-TO-CORE-SW-01
 switchport mode trunk
 no shutdown
!
snmp-server community dist-snmp-ro RO
snmp-server host 10.0.5.1 version 2c dist-snmp-ro
!
line vty 0 15
 login local
 transport input ssh
!
end`,
    size_bytes: 1267,
  },
  {
    hostname: 'dist-sw-01',
    backup_time: daysAgo(65),
    triggered_by: 'pre-change' as const,
    version_label: 'v2024.01.16',
    config_text: `! Backup: ${daysAgo(65).toISOString()}
! Device: dist-sw-01 (10.0.3.1)
version 16.12
hostname dist-sw-01
!
enable secret 9 $9$sKXxDv9B6DqK9.$XxBGTdDpH1rM4EN7Wg8kAqHbFf1lDuG9cV7yW3tSjO
!
interface Vlan1
 ip address 10.0.3.1 255.255.255.0
!
snmp-server community dist-snmp-ro RO
!
line vty 0 15
 transport input ssh
!
end`,
    size_bytes: 549,
  },

  // dist-sw-02 — Cisco Catalyst 9300 (offline)
  {
    hostname: 'dist-sw-02',
    backup_time: daysAgo(8),
    triggered_by: 'scheduled' as const,
    version_label: 'v2024.03.14',
    config_text: `! Backup: ${daysAgo(8).toISOString()}
! Device: dist-sw-02 (10.0.3.2)
! NOTE: Last backup before device went offline
version 16.12
hostname dist-sw-02
!
enable secret 9 $9$tLYyEw0C7ErL0.$YyBHUeDqI2sN5FO8Xh9lBrIcGg2mEvH0dW8zX4uTkP
!
username netadmin privilege 15 secret 9 $9$pqrSTU234vwxYZA$stUvWxYzAb2cdEfGhIjKlMnOpQr
!
interface Vlan1
 ip address 10.0.3.2 255.255.255.0
 no shutdown
!
interface GigabitEthernet1/0/1
 description UPLINK-TO-CORE-SW-02
 switchport mode trunk
 no shutdown
!
snmp-server community dist-snmp-ro RO
!
line vty 0 15
 login local
 transport input ssh
!
end`,
    size_bytes: 987,
  },

  // access-sw-01 — Cisco Catalyst 2960X
  {
    hostname: 'access-sw-01',
    backup_time: daysAgo(1),
    triggered_by: 'scheduled' as const,
    version_label: 'v2024.03.21',
    config_text: `! Backup: ${daysAgo(1).toISOString()}
! Device: access-sw-01 (10.0.4.1)
version 15.2
service timestamps log datetime msec
service password-encryption
!
hostname access-sw-01
!
enable secret 9 $9$uMZzFx1D8FsM1.$ZzCIVfErJ3tO6GP9Yi0mCsJdHh3nFwI1eX9aY5vUlQ
!
username admin privilege 15 secret 9 $9$qrsTUV567wxyz01$tuVwXyZaB1cDeFgHiJkLmNoPqRsT
!
interface Vlan1
 ip address 10.0.4.1 255.255.255.0
 no shutdown
!
interface range GigabitEthernet0/1-48
 switchport mode access
 switchport access vlan 30
 spanning-tree portfast
!
snmp-server community access-ro RO
!
line vty 0 15
 login local
 transport input ssh
!
end`,
    size_bytes: 1098,
  },
  {
    hostname: 'access-sw-01',
    backup_time: daysAgo(32),
    triggered_by: 'scheduled' as const,
    version_label: 'v2024.02.18',
    config_text: `! Backup: ${daysAgo(32).toISOString()}
! Device: access-sw-01 (10.0.4.1)
version 15.2
hostname access-sw-01
!
enable secret 9 $9$uMZzFx1D8FsM1.$ZzCIVfErJ3tO6GP9Yi0mCsJdHh3nFwI1eX9aY5vUlQ
!
interface Vlan1
 ip address 10.0.4.1 255.255.255.0
!
snmp-server community access-ro RO
!
line vty 0 15
 transport input ssh
!
end`,
    size_bytes: 503,
  },

  // access-sw-02 — Cisco Catalyst 2960X
  {
    hostname: 'access-sw-02',
    backup_time: daysAgo(1),
    triggered_by: 'scheduled' as const,
    version_label: 'v2024.03.21',
    config_text: `! Backup: ${daysAgo(1).toISOString()}
! Device: access-sw-02 (10.0.4.2)
version 15.2
hostname access-sw-02
!
enable secret 9 $9$vNAaGy2E9GtN2.$AaDJWgFsK4uP7HQ0Zj1nDtKeIi4oGxJ2fY0bZ6wVmR
!
username admin privilege 15 secret 9 $9$stUVWX890yzab12$uvWxYzAb2cdEfGhIjKlMnOpQrStu
!
interface Vlan1
 ip address 10.0.4.2 255.255.255.0
 no shutdown
!
snmp-server community access-ro RO
!
line vty 0 15
 login local
 transport input ssh
!
end`,
    size_bytes: 689,
  },

  // mgmt-sw-01 — HP ProCurve 2920
  {
    hostname: 'mgmt-sw-01',
    backup_time: daysAgo(7),
    triggered_by: 'manual' as const,
    version_label: 'v2024.03.15',
    config_text: `; Backup: ${daysAgo(7).toISOString()}
; Device: mgmt-sw-01 (10.0.5.1)
; HP ProCurve 2920 Configuration
;
hostname "mgmt-sw-01"
!
interface 1
  name "UPLINK-TO-CORE-SW-01"
  exit
interface 2
  name "SERVER-MGMT-01"
  exit
!
vlan 1
  name "DEFAULT"
  untagged 1-24
  ip address 10.0.5.1 255.255.255.0
  exit
!
snmp-server community "mgmt-snmp-rw" operator
snmp-server host 10.0.5.1 "mgmt-snmp-rw"
!
ip default-gateway 10.0.5.254
!
password manager user-name manager
!`,
    size_bytes: 876,
  },
  {
    hostname: 'mgmt-sw-01',
    backup_time: daysAgo(38),
    triggered_by: 'scheduled' as const,
    version_label: 'v2024.02.12',
    config_text: `; Backup: ${daysAgo(38).toISOString()}
; Device: mgmt-sw-01 (10.0.5.1)
hostname "mgmt-sw-01"
!
vlan 1
  ip address 10.0.5.1 255.255.255.0
  exit
!
snmp-server community "mgmt-snmp-rw" operator
!
ip default-gateway 10.0.5.254
!`,
    size_bytes: 411,
  },

  // ap-floor1-01 — Ubiquiti UniFi U6-Pro
  {
    hostname: 'ap-floor1-01',
    backup_time: daysAgo(14),
    triggered_by: 'manual' as const,
    version_label: 'v2024.03.08',
    config_text: `# Backup: ${daysAgo(14).toISOString()}
# Device: ap-floor1-01 (10.0.6.1)
# Ubiquiti UniFi U6-Pro Configuration Export
{
  "system": {
    "hostname": "ap-floor1-01",
    "ip_address": "10.0.6.1",
    "netmask": "255.255.255.0",
    "gateway": "10.0.6.254"
  },
  "wireless": {
    "radio_2g": {
      "ssid": "CorpNet",
      "security": "WPA2-Enterprise",
      "radius_server": "10.0.0.20",
      "channel": "auto",
      "tx_power": "auto"
    },
    "radio_5g": {
      "ssid": "CorpNet-5G",
      "security": "WPA2-Enterprise",
      "radius_server": "10.0.0.20",
      "channel": "auto",
      "tx_power": "auto"
    }
  },
  "snmp": {
    "community": "ubnt-snmp",
    "version": "2c"
  },
  "management": {
    "ssh_enabled": true,
    "ssh_port": 22,
    "controller_url": "https://10.0.0.30:8443"
  }
}`,
    size_bytes: 867,
  },

  // ap-floor2-01 — Ubiquiti UniFi U6-LR
  {
    hostname: 'ap-floor2-01',
    backup_time: daysAgo(14),
    triggered_by: 'manual' as const,
    version_label: 'v2024.03.08',
    config_text: `# Backup: ${daysAgo(14).toISOString()}
# Device: ap-floor2-01 (10.0.6.2)
# Ubiquiti UniFi U6-LR Configuration Export
{
  "system": {
    "hostname": "ap-floor2-01",
    "ip_address": "10.0.6.2",
    "netmask": "255.255.255.0",
    "gateway": "10.0.6.254"
  },
  "wireless": {
    "radio_2g": {
      "ssid": "CorpNet",
      "security": "WPA2-Enterprise",
      "radius_server": "10.0.0.20",
      "channel": "auto"
    },
    "radio_5g": {
      "ssid": "CorpNet-5G",
      "security": "WPA2-Enterprise",
      "radius_server": "10.0.0.20",
      "channel": "auto"
    }
  },
  "snmp": {
    "community": "ubnt-snmp",
    "version": "2c"
  }
}`,
    size_bytes: 733,
  },

  // ap-dc-01 — Cisco Aironet 2802i (degraded)
  {
    hostname: 'ap-dc-01',
    backup_time: daysAgo(5),
    triggered_by: 'manual' as const,
    version_label: 'v2024.03.17',
    config_text: `! Backup: ${daysAgo(5).toISOString()}
! Device: ap-dc-01 (10.0.6.3)
! WARNING: Device is in DEGRADED state - high temp/CPU
version 8.10
hostname ap-dc-01
!
ip address 10.0.6.3 255.255.255.0
ip default-gateway 10.0.6.254
!
dot11 ssid DC-MGMT-WIRELESS
 authentication open
 authentication key-management wpa version 2
 wpa-psk ascii 7 DC-WPA2-Key-Encrypted
!
interface Dot11Radio0
 ssid DC-MGMT-WIRELESS
 station-role root
 no shutdown
!
snmp-server community cisco-snmp-ro RO
snmp-server host 10.0.5.1 version 2c cisco-snmp-ro
!
username Cisco privilege 15 secret 9 $9$wOBbHzAF0HuO3.$BbEKXhGtL5vQ8IR1Ak2oDuLfJj5pH0K3gZ1cA7xWnS
!
line vty 0 4
 login local
 transport input ssh
!
end`,
    size_bytes: 1045,
  },
]
