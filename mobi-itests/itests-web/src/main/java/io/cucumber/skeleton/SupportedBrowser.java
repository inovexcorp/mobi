package io.cucumber.skeleton;

/*-
 * #%L
 * itests-web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import java.util.Arrays;

public enum SupportedBrowser {
    CHROME ("Chrome"),
    FIREFOX ("Firefox");

    private final String name;

    SupportedBrowser(String name) {
        this.name = name;
    }

    String browserName() {
        return name;
    }

    public static SupportedBrowser fromString(String name) {
        return Arrays.stream(SupportedBrowser.values()).filter(s -> s.name.equalsIgnoreCase(name)).findFirst()
                .orElse(SupportedBrowser.CHROME);
    }
}
