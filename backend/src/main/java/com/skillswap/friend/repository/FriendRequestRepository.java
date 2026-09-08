package com.skillswap.friend.repository;

import com.skillswap.friend.entity.FriendRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, UUID> {

    @Query("SELECT fr FROM FriendRequest fr WHERE (fr.sender.id = :u1 AND fr.receiver.id = :u2) OR (fr.sender.id = :u2 AND fr.receiver.id = :u1) ORDER BY fr.createdAt DESC")
    List<FriendRequest> findRequestsBetweenUsers(@Param("u1") UUID u1, @Param("u2") UUID u2);

    @Query("SELECT fr FROM FriendRequest fr WHERE fr.receiver.id = :receiverId AND fr.status = com.skillswap.friend.entity.FriendRequestStatus.PENDING ORDER BY fr.createdAt DESC")
    List<FriendRequest> findPendingIncomingRequests(@Param("receiverId") UUID receiverId);

    @Query("SELECT fr FROM FriendRequest fr WHERE fr.sender.id = :senderId AND fr.status = com.skillswap.friend.entity.FriendRequestStatus.PENDING ORDER BY fr.createdAt DESC")
    List<FriendRequest> findPendingOutgoingRequests(@Param("senderId") UUID senderId);

    @Query("SELECT fr FROM FriendRequest fr WHERE (fr.sender.id = :userId OR fr.receiver.id = :userId) AND fr.status = com.skillswap.friend.entity.FriendRequestStatus.ACCEPTED ORDER BY fr.updatedAt DESC")
    List<FriendRequest> findAcceptedFriendsForUser(@Param("userId") UUID userId);

    @Query("SELECT fr FROM FriendRequest fr WHERE ((fr.sender.id = :u1 AND fr.receiver.id = :u2) OR (fr.sender.id = :u2 AND fr.receiver.id = :u1)) AND fr.status = com.skillswap.friend.entity.FriendRequestStatus.ACCEPTED")
    Optional<FriendRequest> findAcceptedFriendship(@Param("u1") UUID u1, @Param("u2") UUID u2);
}
