package com.mobi.etl.api.delimited;

/*-
 * #%L
 * com.mobi.etl.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import org.dhatim.fastexcel.reader.Cell;
import org.dhatim.fastexcel.reader.CellType;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Sniped most of this logic from Apache Poi to better enable date format identification. Removed caching of formatting
 * for now.
 */
public class ExcelUtils {
    /**
     * The following patterns are used in {@link #isADateFormat(int, String)}.
     */
    private static final Pattern date_ptrn1 = Pattern.compile("^\\[\\$-.*?]");
    private static final Pattern date_ptrn2 = Pattern.compile("^\\[[a-zA-Z]+]");
    private static final Pattern date_ptrn3a = Pattern.compile("[yYmMdDhHsS]");
    // add "\u5e74 \u6708 \u65e5" for Chinese/Japanese date format:2017 \u5e74 2 \u6708 7 \u65e5
    private static final Pattern date_ptrn3b = Pattern.compile("^[\\[\\]yYmMdDhHsS\\-T/\u5e74\u6708\u65e5,. :\"\\\\]+0*[ampAMP/]*$");
    //  elapsed time patterns: [h],[m] and [s]
    private static final Pattern date_ptrn4 = Pattern.compile("^\\[([hH]+|[mM]+|[sS]+)]");
    // for format which start with "[DBNum1]" or "[DBNum2]" or "[DBNum3]" could be a Chinese date
    private static final Pattern date_ptrn5 = Pattern.compile("^\\[DBNum([123])]");

    /**
     * Given a format ID this will check whether the format represents
     *  an internal excel date format or not.
     */
    public static boolean isInternalDateFormat(int format) {
        return switch (format) {
            // Internal Date Formats as described on page 427 in
            // Microsoft Excel Dev's Kit...
            // see also javadoc in org.apache.poi.ss.usermodel.BuiltinFormats
            // the 0x12 to 0x15 formats are time (only) formats
            // the 0x2d to 0x2f formats are time (only) formats
            case 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x2d, 0x2e, 0x2f -> true;
            default -> false;
        };
    }

    /**
     * Given a format ID and its format String, will check to see if the
     *  format represents a date format or not.
     * Firstly, it will check to see if the format ID corresponds to an
     *  internal excel date format (eg most US date formats)
     * If not, it will check to see if the format string only contains
     *  date formatting characters (ymd-/), which covers most
     *  non US date formats.
     *
     * @param formatIndex The index of the format, eg from ExtendedFormatRecord.getFormatIndex
     * @param formatString The format string, eg from FormatRecord.getFormatString
     * @return true if it is a valid date format, false if not or null
     * @see #isInternalDateFormat(int)
     */
    public static boolean isADateFormat(int formatIndex, String formatString) {

        // First up, is this an internal date format?
        if (isInternalDateFormat(formatIndex)) {
            return true;
        }

        // If we didn't get a real string, don't even cache it as we can always find this out quickly
        if (formatString == null || formatString.isEmpty()) {
            return false;
        }

        String fs = formatString;
        /*if (false) {
            // Normalize the format string. The code below is equivalent
            // to the following consecutive regexp replacements:

             // Translate \- into just -, before matching
             fs = fs.replaceAll("\\\\-","-");
             // And \, into ,
             fs = fs.replaceAll("\\\\,",",");
             // And \. into .
             fs = fs.replaceAll("\\\\\\.",".");
             // And '\ ' into ' '
             fs = fs.replaceAll("\\\\ "," ");

             // If it end in ;@, that's some crazy dd/mm vs mm/dd
             //  switching stuff, which we can ignore
             fs = fs.replaceAll(";@", "");

             // The code above was reworked as suggested in bug 48425:
             // simple loop is more efficient than consecutive regexp replacements.
        }*/
        final int length = fs.length();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            char c = fs.charAt(i);
            if (i < length - 1) {
                char nc = fs.charAt(i + 1);
                if (c == '\\') {
                    switch (nc) {
                        case '-', ',', '.', ' ', '\\' -> {
                            // skip current '\' and continue to the next char
                            continue;
                        }
                    }
                } else if (c == ';' && nc == '@') {
                    i++;
                    // skip ";@" duplets
                    continue;
                }
            }
            sb.append(c);
        }
        fs = sb.toString();

        // short-circuit if it indicates elapsed time: [h], [m] or [s]
        if (date_ptrn4.matcher(fs).matches()) {
            return true;
        }
        // If it starts with [DBNum1] or [DBNum2] or [DBNum3]
        // then it could be a Chinese date
        fs = date_ptrn5.matcher(fs).replaceAll("");
        // If it starts with [$-...], then could be a date, but
        //  who knows what that starting bit is all about
        fs = date_ptrn1.matcher(fs).replaceAll("");
        // If it starts with something like [Black] or [Yellow],
        //  then it could be a date
        fs = date_ptrn2.matcher(fs).replaceAll("");
        // You're allowed something like dd/mm/yy;[red]dd/mm/yy
        //  which would place dates before 1900/1904 in red
        // For now, only consider the first one
        final int separatorIndex = fs.indexOf(';');
        if (0 < separatorIndex && separatorIndex < fs.length()-1) {
            fs = fs.substring(0, separatorIndex);
        }

        // Ensure it has some date letters in it
        // (Avoids false positives on the rest of pattern 3)
        if (! date_ptrn3a.matcher(fs).find()) {
            return false;
        }

        // If we get here, check it's only made up, in any case, of:
        //  y m d h s - \ / , . : [ ] T
        // optionally followed by AM/PM

        return date_ptrn3b.matcher(fs).matches();
    }

    /**
     * Extracts the text value from the provided Cell as close to the displayed value within the Excel application as
     * possible. NOTE: Numeric values, specific floating point values, may be off slightly due to how Excel actually
     * stores the value "under the hood". Scientific notation is kept and if a format string is set, attempts to adhere
     * to it.
     *
     * @param cell The {@link Cell} from an Excel spreadsheet to extract the text out of
     * @return The formatted string of the contents of the Cell
     */
    public static String getCellText(Cell cell) {
        String cellText = cell == null ? "" : cell.getText();
        String dfStr = cell == null ? "" : Optional.ofNullable(cell.getDataFormatString()).orElse("");
        if (cell != null && cell.getType().equals(CellType.NUMBER)
                && (cell.getDataFormatId() == null || !isADateFormat(cell.getDataFormatId(), dfStr))) {
            if (!dfStr.isEmpty() && !dfStr.equals("@")) {
                boolean isExponential = false;
                if (dfStr.contains("E+")) {
                    isExponential = true;
                    dfStr = dfStr.replace("E+", "E");
                }
                DecimalFormat formatter = new DecimalFormat(dfStr);
                cellText = formatter.format(cell.asNumber());
                if (isExponential) {
                    cellText = cellText.replaceAll("E(\\d{2})$", "E+$1");
                }
            } else if (cellText.contains(".")) {
                DecimalFormat df = new DecimalFormat("0", DecimalFormatSymbols.getInstance(Locale.ENGLISH));
                df.setMaximumFractionDigits(340); // 340 = DecimalFormat.DOUBLE_FRACTION_DIGITS
                cellText = df.format(cell.asNumber().doubleValue());
            }
        }
        return cellText;
    }
}
