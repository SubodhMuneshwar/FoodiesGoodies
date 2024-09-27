<?php
 $email=$_POST['email'];
 $password=$_POST['password'];
//  $username=$_POST['uname'];

//  DATABASE CONNECTIVITY
$conn= new mysqli('localhost','root','','foodiesgoodies');
if($conn->connect_error){
    die('Connection Failed:'.$conn->connect_error);
}
else{
    $stmt=$conn->prepare("insert into customer_info(email,password) values('$email','$password')");
    // $stmt->bind_param("ss",$email,$password);
    $stmt->execute();
    echo"Registeration Successfull.";
    header("Location:index.html");
    $stmt->close();
    $conn->close();
}
?>