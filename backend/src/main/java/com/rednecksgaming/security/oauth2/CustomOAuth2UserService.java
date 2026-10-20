package com.rednecksgaming.security.oauth2;

import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        String email = oAuth2User.getAttribute("email");
        if (!StringUtils.hasText(email)) {
            log.warn("OAuth2 login failed: Email not provided by provider {}", registrationId);
            throw new OAuth2AuthenticationException(new OAuth2Error("email_not_found"), "Email not found from OAuth2 provider");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("OAuth2 login failed: User email {} is not registered/whitelisted", email);
                    return new OAuth2AuthenticationException(new OAuth2Error("user_not_whitelisted"),
                            "User email " + email + " is not authorized to access this application.");
                });

        String googleSub = oAuth2User.getAttribute("sub");
        if (StringUtils.hasText(googleSub) && !googleSub.equals(user.getGoogleId())) {
            user.setGoogleId(googleSub);
            userRepository.save(user);
            log.info("Linked Google ID {} to user {}", googleSub, email);
        }

        return new CustomOAuth2User(user, oAuth2User.getAttributes());
    }
}
