-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 21, 2026 at 07:46 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `authdb`
--

-- --------------------------------------------------------

--
-- Table structure for table `login_attempts`
--

CREATE TABLE `login_attempts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `success` tinyint(1) DEFAULT NULL,
  `timestamp` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `login_attempts`
--

INSERT INTO `login_attempts` (`id`, `user_id`, `email`, `ip_address`, `success`, `timestamp`) VALUES
(51, 30, 'j@gmail.com', '127.0.0.1', 1, '2026-03-12 10:43:38'),
(52, 30, 'j@gmail.com', '127.0.0.1', 1, '2026-03-12 10:46:05'),
(53, 30, 'j@gmail.com', '127.0.0.1', 1, '2026-03-12 10:46:35'),
(54, 32, 'karl@gmail.com', '127.0.0.1', 1, '2026-03-12 13:03:21'),
(59, 32, 'karl@gmail.com', '127.0.0.1', 1, '2026-03-12 13:03:52'),
(62, 32, 'karl@gmail.com', '127.0.0.1', 0, '2026-03-12 13:11:50'),
(63, 32, 'karl@gmail.com', '127.0.0.1', 0, '2026-03-12 13:11:55'),
(64, 32, 'karl@gmail.com', '127.0.0.1', 0, '2026-03-12 13:12:04'),
(65, 32, 'karl@gmail.com', '127.0.0.1', 0, '2026-03-12 13:12:05'),
(66, 34, 'admin@gmail.com', '127.0.0.1', 1, '2026-03-12 13:12:38'),
(67, 33, 'Jboy@gmail.com', '127.0.0.1', 1, '2026-03-12 13:13:07'),
(71, 34, 'admin@gmail.com', '127.0.0.1', 1, '2026-03-12 13:13:26'),
(75, 34, 'admin@gmail.com', '127.0.0.1', 1, '2026-03-12 13:15:53'),
(77, 31, 'j@gmail.com', '127.0.0.1', 1, '2026-03-13 19:49:04'),
(79, 35, 'o@gmail.com', '127.0.0.1', 1, '2026-03-13 19:49:28'),
(80, 38, 'j@gmail.com', '127.0.0.1', 1, '2026-03-14 17:13:06'),
(81, 41, 'jasmine@gmail.com', '127.0.0.1', 0, '2026-03-14 21:27:23'),
(82, 42, 'j@gmail.com', '127.0.0.1', 1, '2026-03-14 21:32:21'),
(83, 51, 'o@gmail.com', '127.0.0.1', 1, '2026-03-15 11:41:29'),
(87, 52, 'h@gmail.com', '127.0.0.1', 1, '2026-03-16 20:18:35'),
(91, 52, 'h@gmail.com', '127.0.0.1', 1, '2026-03-16 20:19:18'),
(93, 52, 'h@gmail.com', '127.0.0.1', 1, '2026-03-16 20:26:14'),
(96, 48, 'j@gmail.com', '127.0.0.1', 1, '2026-03-17 15:16:49'),
(100, 48, 'j@gmail.com', '127.0.0.1', 1, '2026-03-17 15:17:26'),
(103, 54, 'Lantoy@gmail.com', '127.0.0.1', 1, '2026-03-21 13:13:17'),
(108, 54, 'Lantoy@gmail.com', '127.0.0.1', 1, '2026-03-21 13:17:12'),
(109, 48, 'j@gmail.com', '127.0.0.1', 1, '2026-03-21 13:19:17'),
(110, 48, 'j@gmail.com', '127.0.0.1', 1, '2026-03-21 13:26:49'),
(114, 55, 'u@gmail.com', '127.0.0.1', 1, '2026-03-21 14:24:10'),
(116, 51, 'o@gmail.com', '127.0.0.1', 1, '2026-03-21 14:38:01');

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `token` varchar(255) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `password_resets`
--

INSERT INTO `password_resets` (`id`, `user_id`, `token`, `expires_at`) VALUES
(20, 49, 'BCSgq7of7DUMVpy8hidC9OFiXoYShRGzb6foKU1mZU8', '2026-03-14 14:43:39'),
(21, 49, 'Czuk9DB6xlq6x1oKY9frVHtyGBf1trwn03zihkp7cnw', '2026-03-14 14:44:08'),
(22, 49, 'WBm5bElCLyYG8tzpWWnVZQ6z9ZMy2NZyg7qzsS2b87A', '2026-03-14 14:44:33'),
(23, 49, '1xrH36ff99Kfmv8EhiDe0Ckc6lY7dsrEbKZrX12C6qs', '2026-03-14 14:44:54'),
(25, 51, 'JYMDZE5G0WU9R-JCgmFac4378RebTfZioZTiGqUUeBk', '2026-03-16 12:32:14'),
(26, 52, 'Nu40__VhrxjA_yA5mrWngjJbdw3-kZmEcN0nIsrrp7c', '2026-03-16 12:35:07'),
(29, 51, 'kwHd_TC7WG9ERBYAvuKiFJg66aoxYDFOoWScaU5ekE8', '2026-03-21 05:12:20'),
(30, 53, 'Z9t_L2-x6doexAul6UGqvPlQuNH-WQfNfqeZhgpUeEg', '2026-03-21 05:13:45'),
(31, 51, 'RiK-PMY9JIfgECI8Bki24RdpSrhErXzXYLwVZq6wHmU', '2026-03-21 05:24:03'),
(32, 51, 'knTcnIPtBr0G8a-Lkw_lilQ9a0XniyegoFXVruZa0io', '2026-03-21 05:26:01'),
(33, 54, 'RTroZUA2yhKvZ8yOCryq1E3iOPGWjgxe_EylGNEAAcw', '2026-03-21 05:27:52'),
(35, 55, 'RWUjernLePUikD2BCZi8Oc5Qf0JzJC1nqXjL2qeg9bM', '2026-03-21 06:44:01'),
(36, 49, '47iyYP5C3K5Od8YVD6UQmg9HYfnTUrbxI2YjbSLgrk8', '2026-03-21 06:52:21');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_blocked` tinyint(1) DEFAULT 0,
  `blocked_until` datetime DEFAULT NULL,
  `reset_key` varchar(255) DEFAULT NULL,
  `reset_method` varchar(20) NOT NULL DEFAULT 'key',
  `security_question` varchar(255) DEFAULT NULL,
  `security_answer` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `created_at`, `is_blocked`, `blocked_until`, `reset_key`, `reset_method`, `security_question`, `security_answer`) VALUES
(48, 'j@gmail.com', '$2b$12$hE9xb7KFR4br9pv56JHDJ.hyD6vmMtA0ihTpCwoyKdHhgpzwhHT7y', '2026-03-14 14:18:49', 0, NULL, 'May282005', 'key', NULL, NULL),
(49, 'k@gmail.com', '$2b$12$FlofUu73Y9aFWsPbezLYXOUHzhRexD1g9fZNNEB1B51zvc7Jv4puC', '2026-03-14 14:28:18', 0, NULL, 'May282005', 'key', NULL, NULL),
(50, 'm@gmail.com', '$2b$12$GaAUzDBQZxtt0w2f2wazXuV5bvHk0/hR4h6StYCMZnPnMxvwC9VNi', '2026-03-14 14:33:16', 0, NULL, 'May282005', 'key', NULL, NULL),
(51, 'o@gmail.com', '$2b$12$tDUNM7bRtRxknZjuA8b2tOr17v15m1vu7dxxE8r71qe7kChCj4HHa', '2026-03-15 03:39:32', 0, NULL, NULL, 'question', 'What is your mother\\\'s maiden name?', '$2b$12$kIB3HDDntr1VHzBi7ak/RuuaD693aTSIt.iun213FlW.Fpynyo9Ai'),
(52, 'h@gmail.com', '$2b$12$3UTIjq1b17a1L4l7Dq5qhuN5qajo6G2wTKJTidSkRjVkrR678dpfO', '2026-03-16 12:18:31', 0, NULL, NULL, 'question', 'What was your first pet\\\'s name?', '$2b$12$H.qASabescLJ.agP4gykvOh7a2/qqxjHoJen58Rkhv3VVC76M8MZ2'),
(53, 't@gmail.com', '$2b$12$MAK26gJ1NKY.K9ZenDF4c.P1mSDinSOsQJ1aohG211WR16oiNPAKW', '2026-03-21 04:58:10', 0, NULL, NULL, 'question', 'What is your favorite color?', '$2b$12$cnnNE59bMhrB5k.3moFLfORdyKIMrfYOW4rwltnoHHZQW837l1l8y'),
(54, 'Lantoy@gmail.com', '$2b$12$fBRiH1kjZnuWhwRX/rfg/uYeU8nh11dXO/IQESjGhxIf/0rd7bwKG', '2026-03-21 05:12:14', 0, NULL, NULL, 'question', 'What city were you born in?', '$2b$12$gSgVe.4S9A/.5vyVDyT9tehGcH5XJVIQl5MhD5hAxkE3.Gp1L7zGa'),
(55, 'u@gmail.com', '$2b$12$CY.erNNJYOFLe0I8o1GIN.oPuVtb1xTXC1rQEQuwgSI.scrTJpydy', '2026-03-21 06:22:37', 0, NULL, NULL, 'question', 'What is your mother\\\'s maiden name?', '$2b$12$UvkuVdmAUOhnZLmn2AI3xeJE4AKp5y9odtgB18CSO.Fpno0VQ7Cjm');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_login_attempts_email` (`email`),
  ADD KEY `ix_login_attempts_user_id` (`user_id`),
  ADD KEY `ix_login_attempts_id` (`id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_password_resets_token` (`token`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `ix_password_resets_id` (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `login_attempts`
--
ALTER TABLE `login_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=117;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
